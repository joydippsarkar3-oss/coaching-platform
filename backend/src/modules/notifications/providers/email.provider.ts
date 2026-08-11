import { Injectable, Logger, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Transactional email provider using nodemailer over SMTP.
 * Supports any SMTP relay (SendGrid, AWS SES SMTP, Mailgun, etc.).
 *
 * Required env vars:
 *   EMAIL_SMTP_HOST  — SMTP hostname, e.g. "smtp.sendgrid.net"
 *                      or "email-smtp.ap-south-1.amazonaws.com"
 *   EMAIL_SMTP_PORT  — SMTP port (default 587; use 465 for SSL)
 *   EMAIL_SMTP_USER  — SMTP username (e.g. "apikey" for SendGrid)
 *   EMAIL_SMTP_PASS  — SMTP password / API key
 *   EMAIL_FROM       — Sender display string,
 *                      e.g. "CompuTrain <noreply@computrain.in>"
 *
 * SendGrid SMTP relay:
 *   HOST=smtp.sendgrid.net  PORT=587  USER=apikey  PASS=<SendGrid API key>
 *
 * AWS SES SMTP:
 *   HOST=email-smtp.<region>.amazonaws.com  PORT=587
 *   USER / PASS from SES console → SMTP settings → Create SMTP credentials
 *   (these are NOT your IAM access/secret key pair)
 */
@Injectable({ scope: Scope.TRANSIENT })
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly configured: boolean;

  private static readonly TEMPLATES_DIR = path.resolve(
    __dirname,
    '../templates',
  );

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('EMAIL_SMTP_HOST', '');
    const port = config.get<number>('EMAIL_SMTP_PORT', 587);
    const user = config.get<string>('EMAIL_SMTP_USER', '');
    const pass = config.get<string>('EMAIL_SMTP_PASS', '');
    this.from  = config.get<string>(
      'EMAIL_FROM',
      'CompuTrain <noreply@computrain.in>',
    );
    this.configured = !!host;

    if (this.configured) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
    }
  }

  /**
   * Send a transactional email.
   *
   * @param to      Recipient address, e.g. "student@example.com"
   * @param subject Email subject line
   * @param html    Full HTML body
   * @param text    Optional plain-text fallback
   */
  async send(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    if (!this.configured) {
      this.logger.warn(
        `[Email] Not configured — set EMAIL_SMTP_HOST. ` +
          `Would have sent to ${to}: ${subject}`,
      );
      return;
    }

    await this.transporter!.sendMail({
      from: this.from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    this.logger.log(`[Email] Sent to ${to} | Subject: ${subject}`);
  }

  /**
   * Load an HTML template from src/modules/notifications/templates/,
   * replace all {{VAR}} placeholders, then send.
   *
   * @param to           Recipient address
   * @param subject      Email subject line
   * @param templateName Filename without extension, e.g. "otp" → otp.html
   * @param vars         Key/value map for {{KEY}} substitution
   */
  async sendTemplate(
    to: string,
    subject: string,
    templateName: string,
    vars: Record<string, string>,
  ): Promise<void> {
    const filePath = path.join(
      EmailProvider.TEMPLATES_DIR,
      `${templateName}.html`,
    );
    let html: string;

    try {
      html = await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      this.logger.error(
        `[Email] Template not found: ${filePath}`,
        (err as Error).message,
      );
      return;
    }

    for (const [key, value] of Object.entries(vars)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }

    await this.send(to, subject, html);
  }
}
