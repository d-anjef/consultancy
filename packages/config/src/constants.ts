/**
 * Global system constants.
 */

// ─── ORGANIZATION ───────────────────────────────────
export const DEFAULT_TIMEZONE = 'Asia/Kathmandu';
export const DEFAULT_CURRENCY = 'NPR';
export const DEFAULT_LOCALE = 'en-NP';
export const DEFAULT_COUNTRY = 'Nepal';

// ─── ID PREFIXES ────────────────────────────────────
export const ID_PREFIXES = {
  STUDENT: 'STU',
  LEAD: 'LEAD',
  COUNSELING: 'CNS',
  APPLICATION: 'APP',
  DOCUMENT: 'DOC',
  INVOICE: 'INV',
  PAYMENT: 'PAY',
  RECEIPT: 'RCP',
  TASK: 'TSK',
  BRANCH: 'BRN',
  TEACHER: 'TCH',
  CLASS: 'CLS',
} as const;

// ─── PAGINATION ─────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── FILE UPLOAD ────────────────────────────────────
export const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

// ─── SECURITY ───────────────────────────────────────
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
export const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MFA_CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 min

// ─── SESSION ────────────────────────────────────────
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── NOTIFICATION ───────────────────────────────────
export const NOTIFICATION_CATEGORIES = {
  COUNSELING: 'COUNSELING',
  DOCUMENTS: 'DOCUMENTS',
  APPLICATIONS: 'APPLICATIONS',
  FINANCE: 'FINANCE',
  ATTENDANCE: 'ATTENDANCE',
  TASKS: 'TASKS',
  ANNOUNCEMENTS: 'ANNOUNCEMENTS',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[keyof typeof NOTIFICATION_CATEGORIES];

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITIES)[keyof typeof NOTIFICATION_PRIORITIES];

export const NOTIFICATION_CHANNEL_STATUSES = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

export type NotificationChannelStatus =
  (typeof NOTIFICATION_CHANNEL_STATUSES)[keyof typeof NOTIFICATION_CHANNEL_STATUSES];

// ─── QUEUE ──────────────────────────────────────────
export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  REPORT: 'report',
  SCHEDULED: 'scheduled',
} as const;

// ─── QR ─────────────────────────────────────────────
export const QR_TOKEN_LENGTH = 32;
export const QR_JWT_EXPIRY = '90d';

// ─── ERROR CODES ────────────────────────────────────
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  BUSINESS_RULE_ERROR: 'BUSINESS_RULE_ERROR',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];