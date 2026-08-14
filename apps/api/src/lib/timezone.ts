import { env } from '../../config/env.js';

export function getCurrentTimestamp(): Date {
  return new Date();
}

export function getStartOfDayUTC(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDayUTC(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function getOrgTimezone(): string {
  return env.ORG_TIMEZONE;
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-NP', {
    timeZone: env.ORG_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTimeForDisplay(date: Date): string {
  return date.toLocaleString('en-NP', {
    timeZone: env.ORG_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function isDateToday(date: Date): boolean {
  const today = getStartOfDayUTC();
  const endOfToday = getEndOfDayUTC();
  return date >= today && date <= endOfToday;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}