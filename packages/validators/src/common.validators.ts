import { z } from 'zod';

/**
 * MongoDB ObjectId validation.
 * 24-character hex string.
 */
export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

/**
 * Email validation.
 * Always lowercase, trimmed, and normalized.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .max(254);

/**
 * Password validation.
 * Minimum 10 chars, must contain upper, lower, number, and special char.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Phone validation.
 * Accepts Nepali phone format (with or without country code).
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+977)?[0-9]{7,10}$/, 'Invalid phone number');

/**
 * Address validation.
 */
export const addressSchema = z.object({
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100).default('Nepal'),
  postalCode: z.string().trim().max(20).optional(),
});

/**
 * Pagination query params.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * ISO date string.
 */
export const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.date().transform((d) => d.toISOString()));

/**
 * Search query string.
 */
export const searchQuerySchema = z.string().trim().min(1).max(200).optional();