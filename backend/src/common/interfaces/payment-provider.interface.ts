/**
 * Payment provider abstraction layer.
 * Concrete implementations: RazorpayProvider, CashfreeProvider.
 * Wired via config flag PAYMENT_GATEWAY=razorpay|cashfree.
 */

export interface CreateOrderParams {
  /** Amount in paise (integer, never float) */
  amountPaise: number;
  currency: string;
  /** Internal receipt/reference string */
  receipt: string;
  /** Arbitrary metadata passed through to the gateway */
  notes?: Record<string, string>;
}

export interface PaymentOrder {
  /** Gateway-assigned order ID */
  orderId: string;
  /** Amount in paise as echoed by the gateway */
  amountPaise: number;
  currency: string;
  status: string;
  /** Raw gateway response for audit / reconciliation */
  raw: unknown;
}

export interface SplitConfig {
  /** Amount in paise that stays with the center */
  centerSharePaise: number;
  /** Amount in paise to be remitted to HO */
  hoSharePaise: number;
  /** Gateway-level split/route configuration if supported */
  gatewaySplitPayload?: unknown;
}

export interface PaymentProvider {
  /**
   * Creates a payment order at the gateway and returns the order details.
   * @param params - order creation parameters
   * @returns PaymentOrder with gateway-assigned orderId
   */
  createOrder(params: CreateOrderParams): Promise<PaymentOrder>;

  /**
   * Verifies a webhook payload's authenticity using the gateway-provided
   * signature. Must be synchronous to run in the request pipeline.
   *
   * @param payload - raw request body Buffer (never parsed before calling this)
   * @param signature - value from the gateway-specific signature header
   * @returns true if the webhook is authentic
   */
  verifyWebhook(payload: Buffer, signature: string): boolean;

  /**
   * Calculates the split between center and HO for a given payment amount.
   * Used to create the two balanced ledger entries per payment.
   *
   * @param amountPaise - total collected amount in paise
   * @param centerId - center UUID (used to look up royalty/split config)
   * @returns SplitConfig with center and HO share in paise
   */
  getSettlementSplit(amountPaise: number, centerId: string): SplitConfig;
}
