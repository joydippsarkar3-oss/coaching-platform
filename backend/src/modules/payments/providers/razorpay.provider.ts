import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  CreateOrderParams,
  PaymentOrder,
  SplitConfig,
} from '../../../common/interfaces/payment-provider.interface';

/**
 * Razorpay payment provider implementation.
 * Uses Razorpay REST API v1. Configure via environment:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 *   HO_SPLIT_BPS — basis points retained by HO (e.g. 1000 = 10%)
 */
@Injectable()
export class RazorpayProvider implements PaymentProvider {
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly keyId = process.env.RAZORPAY_KEY_ID ?? '';
  private readonly keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
  private readonly webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  private readonly hoSplitBps = parseInt(process.env.HO_SPLIT_BPS ?? '1000', 10); // 10%

  /**
   * Creates a Razorpay order via the Orders API.
   * @param params - order creation parameters (amountPaise in integer paise)
   * @returns PaymentOrder with Razorpay order ID
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    const body = JSON.stringify({
      amount: params.amountPaise,        // Razorpay expects paise
      currency: params.currency ?? 'INR',
      receipt: params.receipt,
      notes: params.notes ?? {},
    });

    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay createOrder failed: ${response.status} ${errorText}`);
    }

    const raw = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };

    this.logger.log(`Razorpay order created: ${raw.id}`);

    return {
      orderId: raw.id,
      amountPaise: raw.amount,
      currency: raw.currency,
      status: raw.status,
      raw,
    };
  }

  /**
   * Verifies a Razorpay webhook signature using HMAC-SHA256.
   * Razorpay sends X-Razorpay-Signature header.
   *
   * @param payload - raw request body Buffer (never pre-parsed)
   * @param signature - value of X-Razorpay-Signature header
   * @returns true if the webhook is authentic
   */
  verifyWebhook(payload: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not set — webhook verification skipped');
      return false;
    }
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  }

  /**
   * Calculates the center / HO split for a given amount.
   * HO retains HO_SPLIT_BPS basis points; the remainder goes to the center.
   * In production Razorpay Route can be configured to split at settlement.
   *
   * @param amountPaise - total collected amount in paise (integer)
   * @param centerId - center UUID (reserved for per-center override lookup)
   * @returns SplitConfig with integer paise values
   */
  getSettlementSplit(amountPaise: number, centerId: string): SplitConfig {
    // Integer arithmetic only — never use floating point for money
    const hoSharePaise = Math.floor((amountPaise * this.hoSplitBps) / 10_000);
    const centerSharePaise = amountPaise - hoSharePaise;

    return {
      centerSharePaise,
      hoSharePaise,
      gatewaySplitPayload: {
        // Razorpay Route transfer payload shape (populated when Route is enabled)
        transfers: [
          {
            account: process.env.RAZORPAY_CENTER_ACCOUNT_PREFIX
              ? `${process.env.RAZORPAY_CENTER_ACCOUNT_PREFIX}${centerId}`
              : null,
            amount: centerSharePaise,
            currency: 'INR',
          },
        ],
      },
    };
  }
}
