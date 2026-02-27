/**
 * REST API for CodeDrop.
 * - POST /api/drops       Create drop (get code), optional multipart upload
 * - GET  /api/drops/:code Fetch drop by code (encrypted payload for download)
 */
import express from 'express';
import multer from 'multer';
import Drop from '../models/Drop.js';
import { encrypt, hashCode } from '../utils/crypto.js';
import { generateCode } from '../utils/codeGenerator.js';
import { codeCheckLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// In-memory store for multipart upload (Multer). For large files, consider disk storage.
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/**
 * Create a new drop.
 * Body (JSON): { oneTime?, expiresInMinutes?, expiresInHours? }
 * Or multipart: file + same fields. If file is present, content is from file; else use body.text or body.data.
 */
router.post('/', async (req, res) => {
  try {
    const oneTime = Boolean(req.body.oneTime);
    let expiresInMs = 60 * 60 * 1000; // default 1 hour
    if (req.body.expiresInMinutes) expiresInMs = Math.min(365 * 24 * 60 * 60 * 1000, Number(req.body.expiresInMinutes) * 60 * 1000);
    if (req.body.expiresInHours) expiresInMs = Math.min(365 * 24 * 60 * 60 * 1000, Number(req.body.expiresInHours) * 60 * 60 * 1000);

    let code;
    let codeHash;
    let attempts = 0;
    const maxAttempts = 20;
    do {
      code = generateCode(8);
      codeHash = hashCode(code);
      const exists = await Drop.findOne({ codeHash });
      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);
    if (attempts >= maxAttempts) {
      return res.status(503).json({ error: 'Could not generate unique code. Try again.' });
    }

    // Content: from multer (handled in separate route) or from body
    let raw = req.body.data ? Buffer.from(req.body.data, 'base64') : null;
    if (req.body.text) raw = Buffer.from(req.body.text, 'utf8');
    if (!raw || raw.length === 0) {
      return res.status(400).json({ error: 'No content: send file, text, or data (base64).' });
    }

    const mimeType = req.body.mimeType || 'application/octet-stream';
    const fileName = req.body.fileName || 'file';

    const { encrypted, salt, iv, authTag } = encrypt(raw, code);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await Drop.create({
      codeHash,
      encrypted,
      salt,
      iv,
      authTag,
      mimeType,
      fileName,
      oneTime,
      expiresAt,
    });

    res.status(201).json({
      code,
      expiresAt: expiresAt.toISOString(),
      oneTime,
      message: 'Drop created. Share the code to allow access.',
    });
  } catch (err) {
    console.error('Create drop error:', err);
    res.status(500).json({ error: 'Failed to create drop.' });
  }
});

/**
 * Multipart upload: single file. Creates drop with file content.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const oneTime = Boolean(req.body.oneTime);
    let expiresInMs = 60 * 60 * 1000;
    if (req.body.expiresInMinutes) expiresInMs = Number(req.body.expiresInMinutes) * 60 * 1000;
    if (req.body.expiresInHours) expiresInMs = Number(req.body.expiresInHours) * 60 * 60 * 1000;
    expiresInMs = Math.min(expiresInMs, 365 * 24 * 60 * 60 * 1000);

    let code;
    let codeHash;
    let attempts = 0;
    do {
      code = generateCode(8);
      codeHash = hashCode(code);
      const exists = await Drop.findOne({ codeHash });
      if (!exists) break;
      attempts++;
    } while (attempts++ < 20);
    if (attempts >= 20) return res.status(503).json({ error: 'Could not generate unique code.' });

    const raw = req.file.buffer;
    const { encrypted, salt, iv, authTag } = encrypt(raw, code);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await Drop.create({
      codeHash,
      encrypted,
      salt,
      iv,
      authTag,
      mimeType: req.file.mimetype || 'application/octet-stream',
      fileName: req.file.originalname || 'file',
      oneTime,
      expiresAt,
    });

    res.status(201).json({
      code,
      expiresAt: expiresAt.toISOString(),
      oneTime,
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error('Upload drop error:', err);
    res.status(500).json({ error: 'Failed to create drop.' });
  }
});

/**
 * Get drop by code. Returns encrypted payload + salt/iv/authTag for client-side decryption.
 * If oneTime, document is deleted after this response.
 */
router.get('/:code', codeCheckLimiter, async (req, res) => {
  try {
    const code = (req.params.code || '').toUpperCase().trim();
    if (!code) return res.status(400).json({ error: 'Invalid code.' });

    const codeHash = hashCode(code);
    const drop = await Drop.findOne({ codeHash });
    if (!drop) return res.status(404).json({ error: 'Code not found or expired.' });

    if (drop.expiresAt && new Date() > drop.expiresAt) {
      await Drop.deleteOne({ _id: drop._id });
      return res.status(404).json({ error: 'Code expired.' });
    }

    const payload = {
      encrypted: drop.encrypted.toString('base64'),
      salt: drop.salt.toString('base64'),
      iv: drop.iv.toString('base64'),
      authTag: drop.authTag.toString('base64'),
      mimeType: drop.mimeType,
      fileName: drop.fileName,
    };

    if (drop.oneTime) await Drop.deleteOne({ _id: drop._id });

    res.json(payload);
  } catch (err) {
    console.error('Get drop error:', err);
    res.status(500).json({ error: 'Failed to fetch drop.' });
  }
});

export default router;
