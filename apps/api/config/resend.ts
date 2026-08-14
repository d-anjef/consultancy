import { Resend } from 'resend';
import { env } from './env.js';
import { logger } from '../src/lib/logger.js';

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (resendClient) return resendClient;

  if (!env.RESEND_API_KEY) {
    logger.warn('Resend API key not configured. Email sending will fail.');
    resendClient = new Resend('re_placeholder');
    return resendClient;
  }

  resendClient = new Resend(env.RESEND_API_KEY);
  logger.info('Resend email client initialized');
  return resendClient;
}

export function getEmailConfig() {
  return {
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
    replyTo: env.EMAIL_REPLY_TO,
  };
}