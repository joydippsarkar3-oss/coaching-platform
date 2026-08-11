import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  CreateOrderParams,
  PaymentOrder,
  SplitConfig,
} from '../../../common/interfaces/payment-provider.interface';

/**
 * Cashfree payment provider implementation.
 * Uses Cashfree Payments API v2022-09-01. Configure via environment:
 *   CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_WEBHOOK_SECRET
 *   CASHFREE_ENV — "TEST" | "PROD" (default "TEST")
 *   HO_SPLIT_BPS — basis points retained by HO (e.g. 1000 = 10%)
 */
@Injectable()
export class CashfreeProvider implements PaymentProvider {
  private readonly logger = new Logger(CashfreeProvider.name);
  private readonly appId = process.env.CASHFREE_APP_ID ?? '';
  private readonly secretKey = process.env.CASHFREE_SECRET_KEY ?? '';
  private readonly webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET ?? '';
  private readonly hoSplitBps = parseInt(process.env.HO_SPLIT_BPS ?? '1000', 10);
  private readonly baseUrl =
    (process.env.CASHFREE_ENV ?? 'TEST') === 'PROD'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

  /**
   * Creates a Cashfree order via the Orders API.
   * Cashfree expects amounts in rupees (decimal); we convert from paise internally.
   *
   * @param params - order creation parameters (amountPaise in integer paise)
   * @returns PaymentOrder with Cashfree cf_order_id
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    // Cashfree API accepts amount in rupees — convert from paise
    const amountRupees = params.amountPaise / 100;

    const body = JSON.stringify({
      order_id: params.receipt,
      order_amount: amountRupees,
      order_currency: params.currency ?? 'INR',
      order_note: params.notes ? JSON.stringify(params.notes) : undefined,
    });

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2022-09-01',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cashfree createOrder failed: ${response.status} ${errorText}`);
    }

    const raw = (await response.json()) as {
      cf_order_id: string;
      order_amount: number;
      order_currency: string;
      order_status: string;
    };

    this.logger.log(`Cashfree order created: ${raw.cf_order_id}`);

    return {
      orderId: raw.cf_order_id,
      amountPaise: Math.round(raw.order_amount * 100), // convert back to paise
      currency: raw.order_currency,
      status: raw.order_status,
      raw,
    };
  }

  /**
   * Verifies a Cashfree webhook signature.
   * Cashfree sends x-webhook-signature and x-webhook-timestamp headers.
   * Signature = HMAC-SHA256(timestamp + rawBody, secretKey), base64-encoded.
   *
   * @param payload - raw request body Buffer
   * @param signature - value of x-webhook-signature header (format: "timestamp.base64sig")
   * @returns true if the webhook is authentic
   */
  verifyWebhook(payload: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('CASHFREE_WEBHOOK_SECRET not set — webhook verification skipped');
      return false;
    }

    // Cashfree signature format: "<timestamp>.<base64_encoded_signature>"
    const dotIndex = signature.indexOf('.');
    if (dotIndex === -1) return false;

    const timestamp = signature.substring(0, dotIndex);
    const providedSig = signature.substring(dotIndex + 1);

    const data = timestamp + payload.toString('utf-8');
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(data)
      .digest('base64');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'base64'),
        Buffer.from(providedSig, 'base64'),
      );
    } catch {
      return false;
    }
  }

  /**
   * Calculates the center / HO split. Cashfree Splits API can be configured
   * to route directly at settlement.
   *
   * @param amountPaise - total collected amount in paise (integer)
   * @param centerId - center UUID (reserved for per-center override lookup)
   * @returns SplitConfig with integer paise values
   */
  getSettlementSplit(amountPaise: number, centerId: string): SplitConfig {
    const hoSharePaise = Math.floor((amountPaise * this.hoSplitBps) / 10_000);
    const centerSharePaise = amountPaise - hoSharePaise;

    return {
      centerSharePaise,
      hoSharePaise,
      gatewaySplitPayload: {
        // Cashfree Splits API vendor split payload shape
        vendor_split: [
          {
            vendor_id: centerId,
            amount: centerSharePaise / 100, // Cashfree expects rupees
            percentage: null,
          },
        ],
      },
    };
  }
}
