import { getResendClient, getEmailConfig } from '../../../config/resend.js';
import { env } from '../../../config/env.js';
import { logger } from '../../lib/logger.js';

interface SendInvitationEmailParams {
  to: string;
  recipientName: string;
  invitationToken: string;
  roleName: string;
}

interface SendPasswordResetEmailParams {
  to: string;
  recipientName: string;
  resetToken: string;
}

interface SendMfaCodeEmailParams {
  to: string;
  recipientName: string;
  code: string;
}

export class EmailService {
 private async send(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const config = getEmailConfig();


     if (!env.RESEND_API_KEY) {
    logger.warn(
      { to: params.to, subject: params.subject },
      'Email skipped — Resend not configured (DEV MODE)',
    );
    logger.info({ preview: params.text }, 'Email content (would have been sent)');
    return;
  }

    try {
    const client = getResendClient();
    const result = await client.emails.send({
      from: config.from,
      to: params.to,
      replyTo: config.replyTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      logger.error(
        { error: result.error, to: params.to },
        'Failed to send email (non-blocking)',
      );
      return; // ← Don't throw
    }

    logger.info(
      { to: params.to, subject: params.subject, id: result.data?.id },
      'Email sent',
    );
  } catch (error) {
    logger.error(
      { error, to: params.to, subject: params.subject },
      'Email service error (non-blocking — user/student creation continues)',
    );

  }
}

  async sendInvitationEmail(params: SendInvitationEmailParams): Promise<void> {
    const activationUrl = `${env.WEB_BASE_URL}/activate?token=${params.invitationToken}`;

    const subject = `Welcome to ${env.ORG_NAME} — Activate Your Account`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #111827; margin-top: 0;">Welcome, ${params.recipientName}!</h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You have been invited to join <strong>${env.ORG_NAME}</strong> as a <strong>${params.roleName}</strong>.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            To activate your account and set your password, click the button below:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationUrl}" style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Activate Account
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Or copy this link into your browser:<br>
            <a href="${activationUrl}" style="color: #2563eb; word-break: break-all;">${activationUrl}</a>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            This invitation expires in <strong>7 days</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${env.ORG_NAME}. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${env.ORG_NAME}, ${params.recipientName}!

You have been invited to join ${env.ORG_NAME} as a ${params.roleName}.

Activate your account here:
${activationUrl}

This invitation expires in 7 days.

—
${env.ORG_NAME}
    `.trim();

    await this.send({ to: params.to, subject, html, text });
  }

  async sendCredentialsEmail(params: {
  to: string;
  recipientName: string;
  email: string;
  password: string;
  roleName: string;
}): Promise<void> {
  const loginUrl = `${env.WEB_BASE_URL}/login`;
  const subject = `Your ${env.ORG_NAME} Account Credentials`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #111827; margin-top: 0;">Welcome, ${params.recipientName}!</h1>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your account at <strong>${env.ORG_NAME}</strong> has been activated as a <strong>${params.roleName}</strong>.
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Below are your login credentials. Please keep them safe and change your password after first login.
        </p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
          <p style="margin: 0 0 16px 0; color: #111827; font-size: 15px; font-family: 'SF Mono', Monaco, monospace;">${params.email}</p>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Password</p>
          <p style="margin: 0; color: #111827; font-size: 15px; font-family: 'SF Mono', Monaco, monospace; font-weight: 600;">${params.password}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}" style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Sign In
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Or copy this link: <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} ${env.ORG_NAME}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome, ${params.recipientName}!

Your account at ${env.ORG_NAME} has been activated as a ${params.roleName}.

Login credentials:
Email: ${params.email}
Password: ${params.password}

Sign in at: ${loginUrl}

Please change your password after first login.

— ${env.ORG_NAME}`;

  await this.send({ to: params.to, subject, html, text });
}

  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    const resetUrl = `${env.WEB_BASE_URL}/reset-password?token=${params.resetToken}`;

    const subject = `Reset Your ${env.ORG_NAME} Password`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #111827; margin-top: 0;">Password Reset Request</h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hi ${params.recipientName},
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Or copy this link:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${env.ORG_NAME}. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hi ${params.recipientName},

We received a request to reset your password.

Reset your password here:
${resetUrl}

This link expires in 1 hour.
If you did not request this, please ignore this email.

—
${env.ORG_NAME}
    `.trim();

    await this.send({ to: params.to, subject, html, text });
  }

  async sendMfaCodeEmail(params: SendMfaCodeEmailParams): Promise<void> {
    const subject = `Your ${env.ORG_NAME} Login Code`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #111827;">Login Verification Code</h1>
          <p style="color: #4b5563;">Hi ${params.recipientName},</p>
          <p style="color: #4b5563;">Use this code to complete your login:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; background: #f3f4f6; padding: 20px; border-radius: 8px;">
              ${params.code}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes.</p>
        </div>
      </body>
      </html>
    `;

    const text = `Your ${env.ORG_NAME} login code: ${params.code}\n\nThis code expires in 5 minutes.`;

    await this.send({ to: params.to, subject, html, text });
  }
}

export const emailService = new EmailService();