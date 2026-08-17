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

// ── Shared email layout ──────────────────────────────
const wrapEmail = (title: string, bodyHtml: string): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    ${bodyHtml}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      &copy; ${new Date().getFullYear()} ${env.ORG_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`;

const button = (url: string, label: string, color: string = '#EAB308'): string => `
<div style="text-align: center; margin: 32px 0;">
  <a href="${url}" style="background: ${color}; color: #111827; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
    ${label}
  </a>
</div>`;

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
        return;
      }

      logger.info(
        { to: params.to, subject: params.subject, id: result.data?.id },
        'Email sent',
      );
    } catch (error) {
      logger.error(
        { error, to: params.to, subject: params.subject },
        'Email service error (non-blocking)',
      );
    }
  }

  // ─── Existing: Invitation ──────────────────────────
  async sendInvitationEmail(params: SendInvitationEmailParams): Promise<void> {
    const activationUrl = `${env.WEB_BASE_URL}/activate?token=${params.invitationToken}`;
    const subject = `Welcome to ${env.ORG_NAME} — Activate Your Account`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Welcome, ${params.recipientName}!</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        You have been invited to join <strong>${env.ORG_NAME}</strong> as a <strong>${params.roleName}</strong>.
      </p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        To activate your account and set your password, click the button below:
      </p>
      ${button(activationUrl, 'Activate Account')}
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Or copy this link into your browser:<br>
        <a href="${activationUrl}" style="color: #2563eb; word-break: break-all;">${activationUrl}</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        This invitation expires in <strong>7 days</strong>.
      </p>
    `);

    const text = `Welcome to ${env.ORG_NAME}, ${params.recipientName}!\n\nActivate your account: ${activationUrl}\n\nExpires in 7 days.\n\n— ${env.ORG_NAME}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Lead Intake: Confirmation to Student ─────────────────────────────
async sendLeadIntakeConfirmation(params: {
  toEmail: string;
  firstName: string;
  lastName: string;
  leadNumber: string;
  phone: string;
}): Promise<void> {
  const { toEmail, firstName, lastName, leadNumber, phone } = params;
  const subject = `✅ Inquiry Received — ${leadNumber} | ${env.ORG_NAME}`;

  const html = wrapEmail(subject, `
    <h1 style="color:#111827;margin-top:0;">
      Thank you, ${firstName}! 🎉
    </h1>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      We've received your inquiry at <strong>${env.ORG_NAME}</strong>.
      Our counseling team will review your details and reach out to you shortly.
    </p>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 4px;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">
        Your Reference Number
      </p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#EAB308;letter-spacing:0.05em;">
        ${leadNumber}
      </p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:40%;">Full Name</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${firstName} ${lastName}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Phone</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${phone}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;">Email</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:500;">
          ${toEmail}
        </td>
      </tr>
    </table>

    <div style="background:#f9fafb;border-left:4px solid #EAB308;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
        💡 <strong>What happens next?</strong><br/>
        One of our counselors will contact you within <strong>1–2 business days</strong>
        to schedule your free consultation session.
      </p>
    </div>

    ${button(`${env.WEB_BASE_URL}`, 'Visit Our Website')}

    <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin-top:24px;">
      Have urgent questions? Reply to this email or contact us at
      <a href="mailto:${env.EMAIL_REPLY_TO}" style="color:#EAB308;">${env.EMAIL_REPLY_TO}</a>
    </p>
  `);

  const text = `Thank you ${firstName}!\n\nWe received your inquiry at ${env.ORG_NAME}.\nReference: ${leadNumber}\n\nOur team will contact you within 1-2 business days.\n\n— ${env.ORG_NAME}`;

  await this.send({ to: toEmail, subject, html, text });
}

// ─── Lead Intake: Admin Alert ──────────────────────────────────────────
async sendLeadIntakeAdminAlert(params: {
  leadNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  lastEducation?: string;
  preferredIntake?: string;
  notes?: string;
}): Promise<void> {
  const {
    leadNumber,
    firstName,
    lastName,
    phone,
    email,
    lastEducation,
    preferredIntake,
    notes,
  } = params;

  const subject = `🔔 New Lead: ${firstName} ${lastName} — ${leadNumber}`;
  const adminEmail = env.EMAIL_REPLY_TO;
  const dashboardUrl = `${env.WEB_BASE_URL}/leads`;

  const html = wrapEmail(subject, `
    <h1 style="color:#111827;margin-top:0;">
      📋 New Lead from Google Form
    </h1>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      A new inquiry has been submitted via <strong>Google Form</strong>
      and automatically added to the system.
    </p>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        Lead Reference:
        <strong style="color:#EAB308;font-size:20px;margin-left:8px;">${leadNumber}</strong>
      </p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:40%;">Full Name</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${firstName} ${lastName}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Phone</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${phone}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Email</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${email ?? '—'}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Education</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${lastEducation ?? '—'}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Preferred Intake</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500;">
          ${preferredIntake ?? '—'}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;">Message / Notes</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:500;">
          ${notes ?? '—'}
        </td>
      </tr>
    </table>

    <div style="background:#f9fafb;border-left:4px solid #EAB308;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
        ⚡ <strong>Action required:</strong> Please assign a counselor to this lead
        at your earliest convenience.
      </p>
    </div>

    ${button(dashboardUrl, 'View Lead in Dashboard')}

    <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin-top:24px;">
      This lead was automatically created via the Google Form intake system.
      Source: <strong>GOOGLE_FORM</strong>
    </p>
  `);

  const text = `New lead received!\n\nName: ${firstName} ${lastName}\nPhone: ${phone}\nEmail: ${email ?? '—'}\nReference: ${leadNumber}\n\nView in dashboard: ${dashboardUrl}\n\n— ${env.ORG_NAME} System`;

  await this.send({ to: adminEmail, subject, html, text });
}

  // ─── Existing: Credentials ─────────────────────────
  async sendCredentialsEmail(params: {
    to: string;
    recipientName: string;
    email: string;
    password: string;
    roleName: string;
  }): Promise<void> {
    const loginUrl = `${env.WEB_BASE_URL}/login`;
    const subject = `Your ${env.ORG_NAME} Account Credentials`;

    const html = wrapEmail(subject, `
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
      ${button(loginUrl, 'Sign In')}
    `);

    const text = `Welcome, ${params.recipientName}!\n\nEmail: ${params.email}\nPassword: ${params.password}\n\nSign in: ${loginUrl}\n\n— ${env.ORG_NAME}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Existing: Password Reset ──────────────────────
  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    const resetUrl = `${env.WEB_BASE_URL}/reset-password?token=${params.resetToken}`;
    const subject = `Reset Your ${env.ORG_NAME} Password`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Password Reset Request</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to set a new password:
      </p>
      ${button(resetUrl, 'Reset Password', '#dc2626')}
      <p style="color: #6b7280; font-size: 14px;">This link expires in <strong>1 hour</strong>. If you did not request this, ignore this email.</p>
    `);

    const text = `Reset your password: ${resetUrl}\n\nExpires in 1 hour.`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Existing: MFA Code ────────────────────────────
  async sendMfaCodeEmail(params: SendMfaCodeEmailParams): Promise<void> {
    const subject = `Your ${env.ORG_NAME} Login Code`;
    const html = wrapEmail(subject, `
      <h1 style="color: #111827;">Login Verification Code</h1>
      <p style="color: #4b5563;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563;">Use this code to complete your login:</p>
      <div style="text-align: center; margin: 32px 0;">
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; background: #f3f4f6; padding: 20px; border-radius: 8px;">
          ${params.code}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes.</p>
    `);
    const text = `Your login code: ${params.code}\n\nExpires in 5 minutes.`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ═══════════════════════════════════════════════════
  // NEW TEMPLATES (Chunk 17)
  // ═══════════════════════════════════════════════════

  // ─── Application: Status Changed ───────────────────
  async sendApplicationStatusChanged(params: {
    to: string;
    recipientName: string;
    applicationNumber: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    const appUrl = `${env.WEB_BASE_URL}/my/application`;
    const subject = `Application ${params.applicationNumber} — Status Updated`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Application Status Updated</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Your application <strong>${params.applicationNumber}</strong> status has changed:
      </p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0; text-align: center;">
        <span style="color: #6b7280; font-size: 14px;">${params.oldStatus}</span>
        <span style="color: #EAB308; font-size: 20px; margin: 0 12px;">→</span>
        <span style="color: #111827; font-size: 16px; font-weight: 700;">${params.newStatus}</span>
      </div>
      ${button(appUrl, 'View Application')}
    `);

    const text = `Application ${params.applicationNumber}: ${params.oldStatus} → ${params.newStatus}\n\nView: ${appUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Application: Approved 🎉 ──────────────────────
  async sendApplicationApproved(params: {
    to: string;
    recipientName: string;
    applicationNumber: string;
  }): Promise<void> {
    const appUrl = `${env.WEB_BASE_URL}/my/application`;
    const subject = `🎉 Application ${params.applicationNumber} Approved!`;

    const html = wrapEmail(subject, `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px;">🎉</div>
      </div>
      <h1 style="color: #111827; margin-top: 0; text-align: center;">Congratulations, ${params.recipientName}!</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
        Your application <strong>${params.applicationNumber}</strong> has been <strong style="color: #16a34a;">APPROVED</strong>.
      </p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Our team will contact you shortly with next steps. In the meantime, check your application page for updates.
      </p>
      ${button(appUrl, 'View Application', '#16a34a')}
    `);

    const text = `🎉 Congratulations! Application ${params.applicationNumber} APPROVED.\n\nView: ${appUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Application: Rejected ─────────────────────────
  async sendApplicationRejected(params: {
    to: string;
    recipientName: string;
    applicationNumber: string;
    reason?: string;
  }): Promise<void> {
    const appUrl = `${env.WEB_BASE_URL}/my/application`;
    const subject = `Application ${params.applicationNumber} — Update`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Application Update</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        We regret to inform you that your application <strong>${params.applicationNumber}</strong> has not been approved at this time.
      </p>
      ${params.reason ? `
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Reason</p>
          <p style="margin: 8px 0 0 0; color: #111827; font-size: 15px;">${params.reason}</p>
        </div>
      ` : ''}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Please contact your counselor to discuss next steps. You may be eligible to reapply after addressing the concerns.
      </p>
      ${button(appUrl, 'View Application')}
    `);

    const text = `Application ${params.applicationNumber} not approved.\n${params.reason ? `Reason: ${params.reason}\n` : ''}\nView: ${appUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Invoice: Created ──────────────────────────────
  async sendInvoiceCreated(params: {
    to: string;
    recipientName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: Date;
  }): Promise<void> {
    const feesUrl = `${env.WEB_BASE_URL}/my/fees`;
    const subject = `New Invoice ${params.invoiceNumber} — ${params.currency} ${params.amount.toLocaleString()}`;
    const dueDateStr = params.dueDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">New Invoice</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        A new invoice has been generated for you:
      </p>
      <div style="background: #f3f4f6; padding: 24px; border-radius: 6px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Invoice #</span>
          <span style="color: #111827; font-weight: 600;">${params.invoiceNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Amount Due</span>
          <span style="color: #111827; font-weight: 700; font-size: 18px;">${params.currency} ${params.amount.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280; font-size: 14px;">Due Date</span>
          <span style="color: #dc2626; font-weight: 600;">${dueDateStr}</span>
        </div>
      </div>
      ${button(feesUrl, 'View Invoice')}
      <p style="color: #6b7280; font-size: 14px;">
        Please contact your branch office for payment instructions.
      </p>
    `);

    const text = `New Invoice ${params.invoiceNumber}\nAmount: ${params.currency} ${params.amount}\nDue: ${dueDateStr}\n\nView: ${feesUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Payment: Receipt ──────────────────────────────
  async sendPaymentReceipt(params: {
    to: string;
    recipientName: string;
    receiptNumber: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    paidAt: Date;
    method: string;
  }): Promise<void> {
    const feesUrl = `${env.WEB_BASE_URL}/my/fees`;
    const subject = `Payment Received — Receipt ${params.receiptNumber}`;
    const paidDateStr = params.paidAt.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = wrapEmail(subject, `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px;">✓</div>
      </div>
      <h1 style="color: #111827; margin-top: 0; text-align: center;">Payment Received</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Thank you! We have received your payment. Please keep this receipt for your records.
      </p>
      <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 24px; border-radius: 6px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Receipt #</span>
          <span style="color: #111827; font-weight: 600;">${params.receiptNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Invoice #</span>
          <span style="color: #111827;">${params.invoiceNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Amount Paid</span>
          <span style="color: #16a34a; font-weight: 700; font-size: 18px;">${params.currency} ${params.amount.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">Method</span>
          <span style="color: #111827;">${params.method}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280; font-size: 14px;">Date</span>
          <span style="color: #111827;">${paidDateStr}</span>
        </div>
      </div>
      ${button(feesUrl, 'View All Invoices', '#16a34a')}
    `);

    const text = `Payment Received — Receipt ${params.receiptNumber}\nAmount: ${params.currency} ${params.amount}\nInvoice: ${params.invoiceNumber}\nMethod: ${params.method}\nDate: ${paidDateStr}\n\nView: ${feesUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Document: Rejected (Re-upload needed) ─────────
  async sendDocumentRejected(params: {
    to: string;
    recipientName: string;
    documentName: string;
    reason: string;
  }): Promise<void> {
    const docsUrl = `${env.WEB_BASE_URL}/my/documents`;
    const subject = `Document Needs Re-submission — ${params.documentName}`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Document Re-submission Required</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Your document <strong>${params.documentName}</strong> has been reviewed and needs re-submission.
      </p>
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Reason</p>
        <p style="margin: 8px 0 0 0; color: #111827; font-size: 15px;">${params.reason}</p>
      </div>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Please contact your counselor to re-submit this document.
      </p>
      ${button(docsUrl, 'View Documents')}
    `);

    const text = `Document ${params.documentName} needs re-submission.\nReason: ${params.reason}\n\nView: ${docsUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Counseling: Scheduled ─────────────────────────
  async sendCounselingScheduled(params: {
    to: string;
    recipientName: string;
    counselingNumber: string;
    scheduledDate: Date;
    scheduledTime: string;
    counselorName: string;
    branchName: string;
  }): Promise<void> {
    const subject = `Counseling Session Scheduled — ${params.counselingNumber}`;
    const dateStr = params.scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Counseling Session Scheduled</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Your counseling session has been scheduled. Please make sure to attend on time.
      </p>
      <div style="background: #fefce8; border-left: 4px solid #EAB308; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Date & Time</p>
        <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">${dateStr} at ${params.scheduledTime}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Counselor</p>
        <p style="margin: 0 0 16px 0; color: #111827;">${params.counselorName}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Location</p>
        <p style="margin: 0; color: #111827;">${params.branchName}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        If you need to reschedule, please contact your counselor as soon as possible.
      </p>
    `);

    const text = `Counseling session scheduled\nDate: ${dateStr} at ${params.scheduledTime}\nCounselor: ${params.counselorName}\nLocation: ${params.branchName}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Counseling: Rescheduled ───────────────────────
  async sendCounselingRescheduled(params: {
    to: string;
    recipientName: string;
    counselingNumber: string;
    oldDate: Date;
    oldTime: string;
    newDate: Date;
    newTime: string;
    reason?: string;
  }): Promise<void> {
    const subject = `Counseling Session Rescheduled — ${params.counselingNumber}`;
    const oldStr = `${params.oldDate.toLocaleDateString('en-US')} at ${params.oldTime}`;
    const newStr = `${params.newDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${params.newTime}`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Counseling Rescheduled</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Your counseling session <strong>${params.counselingNumber}</strong> has been rescheduled.
      </p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Previous</p>
        <p style="margin: 0 0 16px 0; color: #9ca3af; text-decoration: line-through;">${oldStr}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">New</p>
        <p style="margin: 0; color: #111827; font-weight: 700; font-size: 16px;">${newStr}</p>
      </div>
      ${params.reason ? `
        <p style="color: #4b5563; font-size: 14px;"><strong>Reason:</strong> ${params.reason}</p>
      ` : ''}
    `);

    const text = `Counseling ${params.counselingNumber} rescheduled\nFrom: ${oldStr}\nTo: ${newStr}${params.reason ? `\nReason: ${params.reason}` : ''}`;
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Announcement / Broadcast ──────────────────────
async sendAnnouncementEmail(params: {
  to: string;
  recipientName: string;
  title: string;
  message: string;
  category: string;
}): Promise<void> {
  const subject = `${params.category === 'HOLIDAY' ? '🎉 ' : params.category === 'EVENT' ? '📅 ' : params.category === 'NOTICE' ? '📢 ' : ''}${params.title}`;

  // Convert plain text message to HTML paragraphs
  const messageHtml = params.message
    .split('\n\n')
    .map((p) => `<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${params.title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #fefce8; border-left: 4px solid #EAB308; padding: 12px 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${params.category}</p>
    </div>
    <h1 style="color: #111827; margin-top: 0;">${params.title}</h1>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
    ${messageHtml}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      &copy; ${new Date().getFullYear()} ${env.ORG_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`;

  const text = `${params.title}\n\nHi ${params.recipientName},\n\n${params.message}\n\n— ${env.ORG_NAME}`;

  await this.send({ to: params.to, subject, html, text });
}



  // ─── Staff: Document Needs Verification ────────────
  async sendDocumentNeedsVerification(params: {
    to: string;
    recipientName: string;
    studentName: string;
    documentName: string;
    documentNumber: string;
  }): Promise<void> {
    const docUrl = `${env.WEB_BASE_URL}/documents`;
    const subject = `Document Verification Needed — ${params.documentNumber}`;

    const html = wrapEmail(subject, `
      <h1 style="color: #111827; margin-top: 0;">Document Awaiting Verification</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${params.recipientName},</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        A new document has been uploaded and needs your verification:
      </p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">STUDENT</p>
        <p style="margin: 0 0 16px 0; color: #111827; font-weight: 600;">${params.studentName}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">DOCUMENT</p>
        <p style="margin: 0 0 4px 0; color: #111827;">${params.documentName}</p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">${params.documentNumber}</p>
      </div>
      ${button(docUrl, 'Review Document')}
    `);

    const text = `Document ${params.documentNumber} (${params.documentName}) from ${params.studentName} needs verification.\n\nReview: ${docUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }
  
}



export const emailService = new EmailService();