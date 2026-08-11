import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * WhatsApp Business API (Meta Cloud API v19+)
 *
 * Required env vars:
 *   WABA_PHONE_NUMBER_ID   — from Meta Business Manager → WhatsApp → Phone numbers
 *   WABA_ACCESS_TOKEN      — System-user permanent token (not a page token)
 *   WABA_BUSINESS_ACCOUNT_ID — optional, used for template management
 *
 * Setup steps (do once, no code change needed after):
 *   1. meta.com/business → Business Settings → System Users → create system user
 *   2. Assign "WhatsApp Business Account" asset with "Full Control"
 *   3. Generate token → copy to WABA_ACCESS_TOKEN
 *   4. Add a phone number → verify → copy Phone Number ID to WABA_PHONE_NUMBER_ID
 *   5. Submit message templates for Meta approval (see sendTemplate below)
 */
@Injectable()
export class WabaProvider {
  private readonly logger = new Logger(WabaProvider.name);
  private readonly http: AxiosInstance;
  private readonly phoneNumberId: string;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const token = config.get<string>('WABA_ACCESS_TOKEN', '');
    this.phoneNumberId = config.get<string>('WABA_PHONE_NUMBER_ID', '');
    this.configured = !!(token && this.phoneNumberId);

    this.http = axios.create({
      baseURL: `https://graph.facebook.com/v19.0`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    });
  }

  /**
   * Send a plain text message inside an open 24-hour customer-initiated window.
   * Use sendTemplate for outbound messages outside that window.
   */
  async sendText(to: string, body: string): Promise<string> {
    if (!this.configured) {
      this.logger.warn(
        `[WABA] Not configured — set WABA_ACCESS_TOKEN + WABA_PHONE_NUMBER_ID. ` +
          `Would have sent to ${to}: ${body.slice(0, 60)}`,
      );
      return 'not_configured';
    }

    const msisdn = this.normalizeMsisdn(to);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: msisdn,
      type: 'text',
      text: { preview_url: false, body },
    };

    const { data } = await this.http.post(
      `/${this.phoneNumberId}/messages`,
      payload,
    );

    const msgId: string = data?.messages?.[0]?.id ?? 'unknown';
    this.logger.log(`[WABA] Sent message to ${msisdn}, id=${msgId}`);
    return msgId;
  }

  /**
   * Send an approved template (required for outbound / marketing messages).
   *
   * @param to       MSISDN with country code, e.g. "919876543210"
   * @param name     Template name as approved in Meta Business Manager
   * @param langCode Template language, e.g. "en_US" or "hi"
   * @param components Array of header/body/button component objects
   *
   * Template registration:
   *   Meta Business Manager → WhatsApp → Message Templates → Create Template
   *   Category: MARKETING | UTILITY | AUTHENTICATION
   *   After approval (24–48 h), use the exact name here.
   *
   * Example components for a fee-reminder template with one body variable:
   *   [{ type: 'body', parameters: [{ type: 'text', text: 'Ravi Kumar' }] }]
   */
  async sendTemplate(
    to: string,
    name: string,
    langCode: string,
    components: object[] = [],
  ): Promise<string> {
    if (!this.configured) {
      this.logger.warn(
        `[WABA] Not configured — would send template "${name}" to ${to}`,
      );
      return 'not_configured';
    }

    const msisdn = this.normalizeMsisdn(to);

    const payload = {
      messaging_product: 'whatsapp',
      to: msisdn,
      type: 'template',
      template: {
        name,
        language: { code: langCode },
        components: components.length ? components : undefined,
      },
    };

    const { data } = await this.http.post(
      `/${this.phoneNumberId}/messages`,
      payload,
    );

    const msgId: string = data?.messages?.[0]?.id ?? 'unknown';
    this.logger.log(
      `[WABA] Sent template "${name}" to ${msisdn}, id=${msgId}`,
    );
    return msgId;
  }

  /**
   * Mark an incoming message as "read" so the double-tick turns blue.
   */
  async markRead(waMessageId: string): Promise<void> {
    if (!this.configured) return;
    await this.http
      .post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: waMessageId,
      })
      .catch((e) =>
        this.logger.warn(`[WABA] markRead failed: ${e.message}`),
      );
  }

  /** Strip leading + and spaces; ensure country code is present. */
  private normalizeMsisdn(raw: string): string {
    return raw.replace(/^\+/, '').replace(/\s/g, '');
  }
}
