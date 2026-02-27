/**
 * Rate limiting for code validation and create-drop endpoints.
 * Limits code-check attempts to reduce brute-force risk.
 */
import rateLimit from 'express-rate-limit';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

export const generalLimiter = rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter limit for code validation (GET /drops/:code) */
export const codeCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many code attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
