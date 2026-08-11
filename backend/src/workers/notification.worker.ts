import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Notification dispatch worker.
 * Consumes queue: notification-dispatch
 *
 * Channel policy:
 *   1. Push (FCM) — free, try first
 *   2. WhatsApp utility — if within 24h service window (last inbound message)
 *   3. SMS DLT — fallback
 *
 * Cost tracking (paise):
 *   Push  = 0
 *   WA    = 115
 *   SMS   = 50
 */

interface NotificationPayload {
  recipientUserId: string;
  templateId: string;
  variables: Record<string, string>;
  channels: Array<'push' | 'whatsapp' | 'sms'>;
}

@Processor('notification-dispatch')
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('dispatch')
  async handleDispatch(job: Job<NotificationPayload>): Promise<void> {
    const { recipientUserId, templateId, variables, channels } = job.data;

    const user = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { id: true, phone: true, email: true, centerId: true },
    });
    if (!user) {
      this.logger.warn(`User ${recipientUserId} not found — skipping notification`);
      return;
    }

    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId },
      select: { body: true, subject: true, channel: true },
    });

    const body = template
      ? this.interpolate(template.body, variables)
      : JSON.stringify(variables);
    const subject = template?.subject ?? '';

    // Check WhatsApp 24h service window
    const inServiceWindow = await this.isInServiceWindow(recipientUserId);

    let channelUsed: 'push' | 'whatsapp' | 'sms' | null = null;
    let costPaise = 0;
    let sent = false;

    for (const ch of channels) {
      if (ch === 'push') {
        sent = await this.sendPush(recipientUserId, subject, body);
        if (sent) { channelUsed = 'push'; costPaise = 0; break; }
      } else if (ch === 'whatsapp' && inServiceWindow) {
        sent = await this.sendWhatsApp(user.phone, body);
        if (sent) { channelUsed = 'whatsapp'; costPaise = 115; break; }
      } else if (ch === 'sms') {
        sent = await this.sendSms(user.phone, body);
        if (sent) { channelUsed = 'sms'; costPaise = 50; break; }
      }
    }

    // Persist notification record
    await this.prisma.notification.create({
      data: {
        userId: recipientUserId,
        centerId: user.centerId,
        templateId,
        channel: channelUsed === 'push' ? 'PUSH'
               : channelUsed === 'whatsapp' ? 'WHATSAPP'
               : channelUsed === 'sms' ? 'SMS'
               : 'IN_APP',
        recipient: user.phone ?? user.email ?? recipientUserId,
        subject,
        body,
        status: sent ? 'SENT' : 'FAILED',
        sentAt: sent ? new Date() : null,
        ['costPaise' as string]: costPaise,
      },
    });

    if (!sent) {
      this.logger.error(`All channels failed for user ${recipientUserId}, template ${templateId}`);
    }
  }

  // ── Channel implementations ───────────────────────────────────────────────

  private async sendPush(userId: string, title: string, body: string): Promise<boolean> {
    // TODO: firebase-admin — obtain FCM token from user_devices table, call
    // admin.messaging().send({ token, notification: { title, body } })
    this.logger.debug(`[PUSH stub] userId=${userId} title="${title}"`);
    return false; // stub returns false; replace with real FCM call
  }

  private async sendWhatsApp(phone: string, body: string): Promise<boolean> {
    // POST https://graph.facebook.com/v17.0/{phoneId}/messages
    // Headers: Authorization: Bearer <WHATSAPP_TOKEN>
    // Body: { messaging_product:"whatsapp", to:<phone>, type:"text", text:{body} }
    this.logger.debug(`[WA stub] to=${phone} body="${body.slice(0, 40)}..."`);
    return false; // stub — replace with real WhatsApp Cloud API call
  }

  private async sendSms(phone: string, body: string): Promise<boolean> {
    // TODO: MSG91 or equivalent DLT-registered SMS gateway
    // POST https://api.msg91.com/api/v5/flow/ with DLT template ID
    this.logger.debug(`[SMS stub] to=${phone} body="${body.slice(0, 40)}..."`);
    return false; // stub — replace with real SMS provider
  }

  // ── Service window check ─────────────────────────────────────────────────

  /**
   * Returns true if the user sent an inbound WhatsApp message within the last 24 hours.
   * WhatsApp Business API restricts outbound utility messages to the 24h window
   * opened by the last inbound message from the user.
   */
  private async isInServiceWindow(userId: string): Promise<boolean> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const recent = await this.prisma.notification.findFirst({
      where: {
        userId,
        channel: 'WHATSAPP',
        ['isInbound' as string]: true,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
    });
    return recent !== null;
  }

  // ── Template variable interpolation ─────────────────────────────────────

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
  }
}
