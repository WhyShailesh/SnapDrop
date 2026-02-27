/**
 * MongoDB schema for a CodeDrop.
 * - Encrypted content stored as Buffer (base64 in JSON).
 * - TTL index for auto-delete after expiresAt.
 * - codeHash used to validate access (code never stored).
 */
import mongoose from 'mongoose';

const dropSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true },
    encrypted: { type: Buffer, required: true },
    salt: { type: Buffer, required: true },
    iv: { type: Buffer, required: true },
    authTag: { type: Buffer, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    fileName: { type: String, default: 'file' },
    oneTime: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'drops' }
);

// TTL: MongoDB automatically deletes documents when expiresAt has passed
dropSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Drop', dropSchema);
