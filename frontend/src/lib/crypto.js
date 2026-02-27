/**
 * Client-side decryption (AES-256-GCM) using Web Crypto API.
 * Mirrors server key derivation: PBKDF2(code, salt) -> key, then AES-GCM decrypt.
 */
const KEY_LEN = 32;
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const PBKDF2_ITERATIONS = 100000;

function base64ToBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Derive key from code and salt (same as server).
 * @param {string} code - Access code (uppercase)
 * @param {ArrayBuffer} salt
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(code, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(code),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Decrypt payload from API (encrypted, salt, iv, authTag as base64).
 * @param {{ encrypted: string, salt: string, iv: string, authTag: string }} payload
 * @param {string} code
 * @returns {Promise<ArrayBuffer>} Decrypted content
 */
export async function decrypt(payload, code) {
  const normalized = (code || '').toUpperCase().trim();
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.encrypted);
  const authTag = base64ToBuffer(payload.authTag);

  const combined = new Uint8Array(ciphertext.byteLength + AUTH_TAG_LEN);
  combined.set(new Uint8Array(ciphertext));
  combined.set(new Uint8Array(authTag), ciphertext.byteLength);

  const key = await deriveKey(normalized, salt);
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    combined
  );
}
