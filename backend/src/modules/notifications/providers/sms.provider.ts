import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * DLT-registered SMS provider (MSG91 — most widely used for India DLT compliance)
 *
 * Required env vars:
 *   SMS_PROVIDER=msg91                   (default)
 *   MSG91_AUTH_KEY                       — from MSG91 dashboard → API → Auth Key
 *   MSG91_SENDER_ID                      — 6-char alphanumeric, e.g. "FRNCHZ"
 *   MSG91_DLT_TE_ID                      — DLT Template Entity ID (from telecom portal)
 *
 * DLT registration steps (India TRAI mandate — do once):
 *   1. Register as Principal Entity on your telecom operator's DLT portal:
 *      Airtel: dlt.airtelbusiness.com  |  Jio: trueconnect.jio.com
 *      BSNL:  smspe.bsnl.co.in        |  Tata: tatateleservices.com/dlt
 *   2. Submit company documents (CIN, GST, address proof).
 *   3. Register Sender ID (Sender Header) — e.g. "FRNCHZ" → get approval (2–7 days).
 *   4. Register each SMS template with its DLT Template ID.
 *      Template body must match exactly what you send (use {#var#} for variables).
 *   5. Copy DLT Template Entity ID (TE ID) → MSG91_DLT_TE_ID.
 *   6. In MSG91 dashboard → DLT → map your sender + TE IDs.
 *
 * MSG91 sandbox:
 *   Set MSG91_AUTH_KEY to a sandbox key during development.
 *   Sandbox does NOT actually deliver SMS but returns success responses.
 */
@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private readonly http: AxiosInstance;
  private readonly authKey: string;
  private readonly senderId: string;
  private readonly dltTeId: string;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    this.authKey   = config.get<string>('MSG91_AUTH_KEY', '');
    this.senderId  = config.get<string>('MSG91_SENDER_ID', 'FRNCHZ');
    this.dltTeId   = config.get<string>('MSG91_DLT_TE_ID', '');
    this.configured = !!this.authKey;

    this.http = axios.create({
      baseURL: 'https://api.msg91.com/api/v5',
      headers: {
        authkey: this.authKey,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });
  }

  /**
   * Send a transactional OTP or notification SMS.
   *
   * @param to      MSISDN with country code, e.g. "919876543210"
   * @param body    Message body — must match a DLT-registered template exactly
   *                (replace variables, the telecom carrier validates the hash)
   * @param dltTeId Override the default DLT Template Entity ID per-message if needed
   */
  async send(to: string, body: string, dltTeId?: string): Promise<string> {
    if (!this.configured) {
      this.logger.warn(
        `[SMS] Not configured — set MSG91_AUTH_KEY. ` +
          `Would have sent to ${to}: ${body.slice(0, 60)}`,
      );
      return 'not_configured';
    }

    const msisdn = this.normalizeMsisdn(to);
    const teId = dltTeId ?? this.dltTeId;

    const payload = {
      sender:    this.senderId,
      route:     '4',           // 4 = transactional (DND bypass for OTP/alerts)
      country:   '91',
      sms: [
        {
          message: body,
          to: [msisdn],
          ...(teId ? { DLT_TE_ID: teId } : {}),
        },
      ],
    };

    const { data } = await this.http.post('/flow/', payload);

    const msgId: string =
      (data as any)?.request_id ?? (data as any)?.message ?? 'unknown';
    this.logger.log(`[SMS] Sent to ${msisdn}, request_id=${msgId}`);
    return msgId;
  }

  /**
   * Send OTP using MSG91's built-in OTP flow (auto-generates and verifies the code).
   * Simpler than managing OTP lifecycle yourself.
   *
   * @param to       MSISDN with country code
   * @param otp      6-digit code you generated
   * @param templateId MSG91 OTP template ID (configure in MSG91 dashboard → OTP)
   */
  async sendOtp(to: string, otp: string, templateId?: string): Promise<string> {
    if (!this.configured) {
      this.logger.warn(`[SMS] OTP not sent to ${to} (not configured)`);
      return 'not_configured';
    }

    const msisdn = this.normalizeMsisdn(to);

    const params: Record<string, string> = {
      authkey:    this.authKey,
      mobile:     msisdn,
      message:    `${otp} is your OTP for franchise training platform. Valid 10 minutes. DO NOT share.`,
      sender:     this.senderId,
      otp:        otp,
      ...(templateId ? { template_id: templateId } : {}),
      ...(this.dltTeId ? { DLT_TE_ID: this.dltTeId } : {}),
    };

    const qs = new URLSearchParams(params).toString();
    const { data } = await axios.get(
      `https://api.msg91.com/api/sendotp.php?${qs}`,
    );

    const msgId: string = (data as any)?.request_id ?? 'unknown';
    this.logger.log(`[SMS] OTP sent to ${msisdn}, request_id=${msgId}`);
    return msgId;
  }

  /** Strip leading + and spaces. */
  private normalizeMsisdn(raw: string): string {
    return raw.replace(/^\+/, '').replace(/\s/g, '');
  }
}
