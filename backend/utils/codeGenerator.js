/**
 * Generates short, unique uppercase alphanumeric codes (6–8 chars).
 */
import crypto from 'crypto';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_LENGTH = 8;

/**
 * Generate a random code of given length.
 * @param {number} length - 6 to 8
 * @returns {string}
 */
export function generateCode(length = DEFAULT_LENGTH) {
  const len = Math.min(8, Math.max(6, length));
  let code = '';
  for (let i = 0; i < len; i++) {
    code += CHARS[crypto.randomInt(0, CHARS.length)];
  }
  return code;
}
