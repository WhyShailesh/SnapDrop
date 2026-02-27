import 'dotenv/config';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import dropsRouter from './routes/drops.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { encrypt, hashCode } from './utils/crypto.js';
import { generateCode } from './utils/codeGenerator.js';
import Drop from './models/Drop.js';

await connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
});

// In-memory streaming uploads: code -> { chunks: Buffer[], meta, complete }
const streamingUploads = new Map();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

app.use('/api/drops', dropsRouter);
app.get('/health', (req, res) => res.json({ ok: true }));

// ----- Socket.io: real-time transfer -----
io.on('connection', (socket) => {
  socket.on('create_stream_drop', async (options, ack) => {
    try {
      const oneTime = Boolean(options?.oneTime);
      let expiresInMs = 60 * 60 * 1000;
      if (options?.expiresInMinutes) expiresInMs = Number(options.expiresInMinutes) * 60 * 1000;
      if (options?.expiresInHours) expiresInMs = Number(options.expiresInHours) * 60 * 60 * 1000;
      expiresInMs = Math.min(expiresInMs, 365 * 24 * 60 * 60 * 1000);

      let code;
      let codeHash;
      for (let i = 0; i < 20; i++) {
        code = generateCode(8);
        codeHash = hashCode(code);
        const exists = await Drop.findOne({ codeHash });
        if (!exists) break;
      }
      const room = `drop:${code}`;
      socket.join(room);
      streamingUploads.set(code, {
        codeHash,
        chunks: [],
        mimeType: options?.mimeType || 'application/octet-stream',
        fileName: options?.fileName || 'file',
        oneTime,
        expiresAt: new Date(Date.now() + expiresInMs),
        createdAt: Date.now(),
      });
      ack?.({ code, expiresAt: streamingUploads.get(code).expiresAt.toISOString(), oneTime });
    } catch (err) {
      ack?.({ error: err.message || 'Failed to create drop' });
    }
  });

  socket.on('stream_chunk', (payload) => {
    const { code, chunk } = payload;
    if (!code || chunk === undefined) return;
    const data = streamingUploads.get(code);
    if (!data) return;
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'base64');
    data.chunks.push(buf);
    socket.to(`drop:${code}`).emit('stream_chunk', { chunk: buf.toString('base64') });
  });

  socket.on('stream_complete', async (payload, ack) => {
    const { code } = payload || {};
    if (!code) return ack?.({ error: 'Missing code' });
    const data = streamingUploads.get(code);
    if (!data) return ack?.({ error: 'Drop not found' });
    try {
      const raw = Buffer.concat(data.chunks);
      const { encrypted, salt, iv, authTag } = encrypt(raw, code);
      await Drop.create({
        codeHash: data.codeHash,
        encrypted,
        salt,
        iv,
        authTag,
        mimeType: data.mimeType,
        fileName: data.fileName,
        oneTime: data.oneTime,
        expiresAt: data.expiresAt,
      });
      streamingUploads.delete(code);
      io.to(`drop:${code}`).emit('stream_complete', { stored: true });
      ack?.({ ok: true });
    } catch (err) {
      console.error('Stream complete error:', err);
      ack?.({ error: 'Failed to save drop' });
    }
  });

  socket.on('join_drop', (code, ack) => {
    const normalized = (code || '').toUpperCase().trim();
    if (!normalized) return ack?.({ error: 'Invalid code' });
    const data = streamingUploads.get(normalized);
    socket.join(`drop:${normalized}`);
    if (data) {
      const existing = Buffer.concat(data.chunks).toString('base64');
      ack?.({ joined: true, existingChunks: existing, meta: { mimeType: data.mimeType, fileName: data.fileName } });
    } else {
      ack?.({ joined: true, existingChunks: null, meta: null });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`CodeDrop server running on port ${PORT}`);
});
