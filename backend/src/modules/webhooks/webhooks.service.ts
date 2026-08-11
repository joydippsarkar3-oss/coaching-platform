import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

/** Handles inbound webhooks from Razorpay, Cashfree, WhatsApp, and Meta. */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Razorpay ─────────────────────────────────────────────────────────────

  verifyRazorpaySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  }

  async handleRazorpay(rawBody: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
    if (!this.verifyRazorpaySignature(rawBody, signature, secret)) {
      throw new BadRequestException('Invalid Razorpay signature');
    }

    const event = JSON.parse(rawBody);
    this.logger.log(`Razorpay event: ${event.event}`);

    switch (event.event) {
      case 'payment.captured':
        await this.reconcilePayment(
          event.payload?.payment?.entity?.id,
          'SUCCESS',
          event.payload?.payment?.entity,
        );
        break;
      case 'payment.failed':
        await this.reconcilePayment(
          event.payload?.payment?.entity?.id,
          'FAILED',
          event.payload?.payment?.entity,
        );
        break;
      case 'refund.processed':
        await this.reconcilePayment(
          event.payload?.payment?.entity?.id,
          'REFUNDED',
          event.payload?.refund?.entity,
        );
        break;
      default:
        this.logger.debug(`Unhandled Razorpay event: ${event.event}`);
    }

    return { received: true };
  }

  // ─── Cashfree ─────────────────────────────────────────────────────────────

  verifyCashfreeSignature(
    timestamp: string,
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    const data = timestamp + rawBody;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  async handleCashfree(
    rawBody: string,
    timestamp: string,
    signature: string,
  ) {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET ?? '';
    if (!this.verifyCashfreeSignature(timestamp, rawBody, signature, secret)) {
      throw new BadRequestException('Invalid Cashfree signature');
    }

    const event = JSON.parse(rawBody);
    this.logger.log(`Cashfree event: ${event.type}`);

    switch (event.type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await this.reconcilePayment(
          event.data?.payment?.cf_payment_id,
          'SUCCESS',
          event.data?.payment,
        );
        break;
      case 'PAYMENT_FAILED_WEBHOOK':
        await this.reconcilePayment(
          event.data?.payment?.cf_payment_id,
          'FAILED',
          event.data?.payment,
        );
        break;
      default:
        this.logger.debug(`Unhandled Cashfree event: ${event.type}`);
    }

    return { received: true };
  }

  // ─── WhatsApp (Meta Cloud API) ─────────────────────────────────────────────

  /** Verify Meta webhook subscription challenge. */
  verifyWhatsAppChallenge(
    mode: string,
    token: string,
    challenge: string,
  ): string {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? '';
    if (mode === 'subscribe' && token === verifyToken) return challenge;
    throw new BadRequestException('WhatsApp webhook verification failed');
  }

  async handleWhatsApp(body: any) {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const messages = changes?.messages ?? [];

    for (const msg of messages) {
      const phone = msg.from; // MSISDN without +
      const text: string = msg.text?.body ?? '';

      this.logger.log(`WhatsApp inbound from ${phone}: ${text.slice(0, 40)}`);

      // Update or open a 24-hour window
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await this.prisma.whatsappWindow.upsert({
        where: {
          // unique on phone — we use a pseudo-composite: just phone for simplicity
          // In prod add a @@unique([phone]) or use findFirst + create
          id: `phone_${phone}`,
        },
        update: {
          lastMsgAt: now,
          expiresAt,
          msgCount: { increment: 1 },
        },
        create: {
          id: `phone_${phone}`,
          phone,
          openedAt: now,
          expiresAt,
          lastMsgAt: now,
          msgCount: 1,
        },
      });

      // Record as inbound notification for CRM
      await this.prisma.notification.create({
        data: {
          channel: 'WHATSAPP',
          recipient: phone,
          body: text,
          status: 'READ',
          isInbound: true,
          sentAt: now,
        },
      });
    }

    return { received: true };
  }

  // ─── Meta Leads ───────────────────────────────────────────────────────────

  async handleMetaLeads(body: any) {
    const entry = body?.entry?.[0];
    const changes = entry?.changes ?? [];

    for (const change of changes) {
      if (change.field !== 'leadgen') continue;
      const leadId: string = change.value?.leadgen_id;
      const pageId: string = change.value?.page_id;
      this.logger.log(`Meta lead: leadId=${leadId} pageId=${pageId}`);
      // TODO: call Meta Graph API to fetch lead details and create Enquiry
    }

    return { received: true };
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  private async reconcilePayment(
    gatewayRef: string,
    status: 'SUCCESS' | 'FAILED' | 'REFUNDED',
    gatewayPayload: any,
  ) {
    if (!gatewayRef) return;
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRef },
    });
    if (!payment) {
      this.logger.warn(`reconcilePayment: no payment with ref=${gatewayRef}`);
      return;
    }
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paidAt: status === 'SUCCESS' ? new Date() : undefined,
        gatewayPayload,
      },
    });
    this.logger.log(
      `Payment ${payment.id} reconciled → ${status} (ref=${gatewayRef})`,
    );
  }
}
