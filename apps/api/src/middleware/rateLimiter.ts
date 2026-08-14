import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { ERROR_CODES } from '@consultancy/config';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many requests. Please try again later.',
    },
  },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
  skip: (req) => {
    return req.path === '/api/health';
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    return `login_${email}_${ip}`;
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many password reset requests. Please try again in 1 hour.',
    },
  },
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    const ip = req.ip || 'unknown';
    return `password_reset_${email}_${ip}`;
  },
});