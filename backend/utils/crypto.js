/**
 * AES-256-GCM encryption utilities.
 * Content is encrypted before storage; decryption uses code-derived key.
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const SALT_LEN = 32;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derive encryption key from access code using PBKDF2.
 * @param {string} code - The drop access code
 * @param {Buffer} salt - Random salt (stored with the drop)
 * @returns {Buffer} 32-byte key
 */
/**
 * Key is derived from code + salt only so the client can decrypt with the same code.
 * ENCRYPTION_PEPPER is optional and only used for codeHash (extra server-side secrecy).
 */
export function deriveKey(code, salt) {
  return crypto.pbkdf2Sync(code, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
}

/**
 * Hash code for storage (validation only; never store plain code).
 * Optional ENCRYPTION_PEPPER adds server-side secrecy to the hash.
 * @param {string} code
 * @returns {string} hex hash
 */
export function hashCode(code) {
  const pepper = process.env.ENCRYPTION_PEPPER || '';
  const payload = pepper ? `${code.toUpperCase()}:${pepper}` : code.toUpperCase();
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Encrypt buffer with code-derived key.
 * @param {Buffer} data - Raw content
 * @param {string} code - Access code
 * @returns {{ encrypted: Buffer, salt: Buffer, iv: Buffer, authTag: Buffer }}
 */
export function encrypt(data, code) {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(code.toUpperCase(), salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, salt, iv, authTag };
}

/**
 * Decrypt buffer using code and stored salt/iv/authTag.
 * @param {Buffer} encrypted
 * @param {string} code
 * @param {Buffer} salt
 * @param {Buffer} iv
 * @param {Buffer} authTag
 * @returns {Buffer} Decrypted content
 */
export function decrypt(encrypted, code, salt, iv, authTag) {
  const key = deriveKey(code.toUpperCase(), salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
