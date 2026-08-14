export const API_PREFIX = '/api/v1';

export const HEALTH_ENDPOINT = '/api/health';

export const PUBLIC_ROUTES = [
  '/api/health',
  '/api/health/detailed',
  '/api/v1/auth/login',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/activate',
  '/api/v1/auth/mfa/verify',
  '/api/v1/leads/intake',
];

export const SESSION_CONFIG = {
  ROLLING: true,
  SAVE_UNINITIALIZED: false,
  RESAVE: false,
} as const;