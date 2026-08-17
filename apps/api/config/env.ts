import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function optionalEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') return defaultValue;
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

function optionalEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
}

export const env = {
  // Node
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: optionalEnvNumber('PORT', 4000),
  API_BASE_URL: optionalEnv('API_BASE_URL', 'http://localhost:4000'),
  WEB_BASE_URL: optionalEnv('WEB_BASE_URL', 'http://localhost:3000'),
  API_VERSION: optionalEnv('API_VERSION', 'v1'),

  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
  isTest: optionalEnv('NODE_ENV', 'development') === 'test',

  // Database
  MONGODB_URI: requireEnv('MONGODB_URI'),
  MONGODB_DB_NAME: requireEnv('MONGODB_DB_NAME'),

  // Redis
  REDIS_URL: requireEnv('REDIS_URL'),
  REDIS_TLS: optionalEnvBoolean('REDIS_TLS', false),

  // Session
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  COOKIE_NAME: optionalEnv('COOKIE_NAME', 'consultancy_session'),
  COOKIE_DOMAIN: optionalEnv('COOKIE_DOMAIN', 'localhost'),
  COOKIE_SECURE: optionalEnvBoolean('COOKIE_SECURE', false),
  COOKIE_SAMESITE: optionalEnv('COOKIE_SAMESITE', 'lax') as 'lax' | 'strict' | 'none',
  SESSION_MAX_AGE_MS: optionalEnvNumber('SESSION_MAX_AGE_MS', 7 * 24 * 60 * 60 * 1000),

  // Security
  BCRYPT_ROUNDS: optionalEnvNumber('BCRYPT_ROUNDS', 12),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_QR_EXPIRY: optionalEnv('JWT_QR_EXPIRY', '90d'),
  MFA_ISSUER: optionalEnv('MFA_ISSUER', 'JapanConsultancy'),
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: optionalEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: optionalEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  LOGIN_RATE_LIMIT_MAX: optionalEnvNumber('LOGIN_RATE_LIMIT_MAX', 5),
  LOGIN_RATE_LIMIT_WINDOW_MS: optionalEnvNumber('LOGIN_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),

  // Cloudflare R2
  R2_ACCOUNT_ID: optionalEnv('R2_ACCOUNT_ID', ''),
  R2_ACCESS_KEY_ID: optionalEnv('R2_ACCESS_KEY_ID', ''),
  R2_SECRET_ACCESS_KEY: optionalEnv('R2_SECRET_ACCESS_KEY', ''),
  R2_BUCKET_NAME: optionalEnv('R2_BUCKET_NAME', 'consultancy-documents'),
  R2_PUBLIC_URL: optionalEnv('R2_PUBLIC_URL', ''),
  R2_SIGNED_URL_EXPIRY_SECONDS: optionalEnvNumber('R2_SIGNED_URL_EXPIRY_SECONDS', 300),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optionalEnv('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: optionalEnv('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: optionalEnv('CLOUDINARY_API_SECRET', ''),
  CLOUDINARY_UPLOAD_FOLDER: optionalEnv('CLOUDINARY_UPLOAD_FOLDER', 'consultancy/profile-photos'),

  // Resend
  RESEND_API_KEY: optionalEnv('RESEND_API_KEY', ''),
  EMAIL_FROM_ADDRESS: optionalEnv('EMAIL_FROM_ADDRESS', 'noreply@yourdomain.com'),
  EMAIL_FROM_NAME: optionalEnv('EMAIL_FROM_NAME', 'Japan Consultancy'),
  EMAIL_REPLY_TO: optionalEnv('EMAIL_REPLY_TO', 'support@yourdomain.com'),

  // Lead Intake
  LEAD_INTAKE_API_KEY: optionalEnv('LEAD_INTAKE_API_KEY', ''),

  // Organization
  ORG_NAME: optionalEnv('ORG_NAME', 'Japan Consultancy'),
  ORG_TIMEZONE: optionalEnv('ORG_TIMEZONE', 'Asia/Kathmandu'),
  ORG_CURRENCY: optionalEnv('ORG_CURRENCY', 'NPR'),
  ORG_LOCALE: optionalEnv('ORG_LOCALE', 'en-NP'),
  DEFAULT_COUNTRY: optionalEnv('DEFAULT_COUNTRY', 'Nepal'),

  // Super Admin
  SUPER_ADMIN_EMAIL: optionalEnv('SUPER_ADMIN_EMAIL', 'superadmin@yourdomain.com'),
  SUPER_ADMIN_PASSWORD: optionalEnv('SUPER_ADMIN_PASSWORD', ''),
  SUPER_ADMIN_FIRST_NAME: optionalEnv('SUPER_ADMIN_FIRST_NAME', 'Super'),
  SUPER_ADMIN_LAST_NAME: optionalEnv('SUPER_ADMIN_LAST_NAME', 'Admin'),

  // Monitoring
  SENTRY_DSN: optionalEnv('SENTRY_DSN', ''),
  LOG_LEVEL: optionalEnv('LOG_LEVEL', 'info'),

  // Queue
  QUEUE_CONCURRENCY_NOTIFICATION: optionalEnvNumber('QUEUE_CONCURRENCY_NOTIFICATION', 5),
  QUEUE_CONCURRENCY_EMAIL: optionalEnvNumber('QUEUE_CONCURRENCY_EMAIL', 3),
  QUEUE_RETRY_ATTEMPTS: optionalEnvNumber('QUEUE_RETRY_ATTEMPTS', 3),
  QUEUE_RETRY_BACKOFF_MS: optionalEnvNumber('QUEUE_RETRY_BACKOFF_MS', 5000),

  // VAPID (Push Notifications)
VAPID_PUBLIC_KEY: optionalEnv('VAPID_PUBLIC_KEY', ''),
VAPID_PRIVATE_KEY: optionalEnv('VAPID_PRIVATE_KEY', ''),
VAPID_CONTACT_EMAIL: optionalEnv('VAPID_CONTACT_EMAIL', 'admin@chibaeducation.com'),

  // CORS
  CORS_ALLOWED_ORIGINS: optionalEnv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
} as const;

export type Env = typeof env;