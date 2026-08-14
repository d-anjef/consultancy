import { APP_CONSTANTS } from '@/data/constants';

/**
 * Format a number as NPR currency.
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat(APP_CONSTANTS.CURRENCY.LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `${APP_CONSTANTS.CURRENCY.SYMBOL} ${formatted}` : formatted;
}

/**
 * Format a number with thousands separator (no currency).
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat(APP_CONSTANTS.CURRENCY.LOCALE).format(num);
}

/**
 * Format a phone number for display.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('977')) {
    const local = cleaned.slice(3);
    return `+977 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`.trim();
  }
  return phone;
}

/**
 * Get initials from a full name (max 2 characters).
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() ?? '';
  const last = lastName?.charAt(0).toUpperCase() ?? '';
  return `${first}${last}` || '?';
}

/**
 * Truncate a string with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

/**
 * Format a large number with K/M suffix.
 */
export function formatCompact(num: number): string {
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}

/**
 * Format bytes to human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Convert a status string (e.g., PENDING_ACTIVATION) to Title Case.
 */
export function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}