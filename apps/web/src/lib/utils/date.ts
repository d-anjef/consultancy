import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
import { APP_CONSTANTS } from '@/data/constants';

type DateInput = Date | string | number;

function toDate(input: DateInput): Date | null {
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === 'string') {
    const parsed = parseISO(input);
    return isValid(parsed) ? parsed : null;
  }
  const d = new Date(input);
  return isValid(d) ? d : null;
}

export function formatDate(input: DateInput, fmt = APP_CONSTANTS.DATE_FORMAT.SHORT): string {
  const date = toDate(input);
  if (!date) return '—';
  return format(date, fmt);
}

export function formatDateTime(input: DateInput): string {
  return formatDate(input, APP_CONSTANTS.DATE_FORMAT.WITH_TIME);
}

export function formatTime(input: DateInput): string {
  return formatDate(input, APP_CONSTANTS.DATE_FORMAT.TIME_ONLY);
}

export function formatRelativeTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return '—';
  return formatDistance(date, new Date(), { addSuffix: true });
}

export function formatFriendlyDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) return '—';
  return formatRelative(date, new Date());
}