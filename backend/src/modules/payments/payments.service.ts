import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { CashfreeProvider } from './providers/cashfree.provider';
import { PaymentProvider } from '../../common/interfaces/payment-provider.interface';
import { FeesService } from '../fees/fees.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly razorpay: RazorpayProvider,
    private readonly cashfree: CashfreeProvider,
    private readonly prisma: PrismaService,
    private readonly feesService: FeesService,
  ) {}

  getProvider(): PaymentProvider {
    const gateway = this.config.get<string>('PAYMENT_GATEWAY', 'razorpay');
    return gateway === 'cashfree' ? this.cashfree : this.razorpay;
  }

  /**
   * Creates a gateway checkout order and stores a pending payment record.
   * Returns the gateway order payload for the client to complete checkout.
   */
  async createCheckoutOrder(
    enrollmentId: string,
    installmentId: string,
    amountPaise: number,
    centerId: string,
  ): Promise<{
    gatewayOrderId: string;
    amountPaise: number;
    currency: string;
    gateway: string;
    raw: unknown;
  }> {
    const installment = await this.prisma.installment.findUnique({
      where: { id: installmentId },
      select: { id: true, amountPaise: true, status: true, enrollmentId: true },
    });

    if (!installment) {
      throw new NotFoundException(`Installment ${installmentId} not found`);
    }
    if (installment.enrollmentId !== enrollmentId) {
      throw new BadRequestException('Installment does not belong to this enrollment');
    }
    if (installment.status === 'PAID') {
      throw new BadRequestException('Installment is already fully paid');
    }
    if (amountPaise <= 0 || amountPaise > installment.amountPaise) {
      throw new BadRequestException(
        `Invalid amount: must be between 1 and ${installment.amountPaise} paise`,
      );
    }

    const provider = this.getProvider();
    const gateway = this.config.get<string>('PAYMENT_GATEWAY', 'razorpay');

    const receipt = `${enrollmentId.slice(0, 8)}-${installmentId.slice(0, 8)}-${Date.now()}`;

    const order = await provider.createOrder({
      amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        enrollmentId,
        installmentId,
        centerId,
      },
    });

    // Store a PENDING payment record so we can reconcile on webhook
    await this.prisma.payment.create({
      data: {
        installmentId,
        amountPaise,
        method: 'ONLINE',
        status: 'PENDING',
        gatewayRef: order.orderId,
        centerId: centerId ?? null,
      },
    });

    this.logger.log(
      `Checkout order created: gateway=${gateway} orderId=${order.orderId} ` +
        `enrollmentId=${enrollmentId} installmentId=${installmentId}`,
    );

    return {
      gatewayOrderId: order.orderId,
      amountPaise: order.amountPaise,
      currency: order.currency,
      gateway,
      raw: order.raw,
    };
  }

  /**
   * Verifies a webhook signature and, if valid, triggers the ledger write
   * via FeesService.collectPayment.
   */
  async handleWebhook(
    payload: Buffer,
    signature: string,
    source: 'razorpay' | 'cashfree',
  ): Promise<void> {
    const provider: PaymentProvider = source === 'cashfree' ? this.cashfree : this.razorpay;

    const valid = provider.verifyWebhook(payload, signature);
    if (!valid) {
      this.logger.warn(`Webhook signature verification failed for source=${source}`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(payload.toString('utf-8')) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Malformed webhook payload');
    }

    if (source === 'razorpay') {
      await this.handleRazorpayEvent(event);
    } else {
      await this.handleCashfreeEvent(event);
    }
  }

  private async handleRazorpayEvent(event: Record<string, unknown>): Promise<void> {
    const eventType = event['event'] as string | undefined;

    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      this.logger.log(`Razorpay event ignored: ${eventType}`);
      return;
    }

    const payload = event['payload'] as Record<string, unknown> | undefined;
    const paymentEntity =
      (payload?.['payment'] as Record<string, unknown> | undefined)?.['entity'] as
        | Record<string, unknown>
        | undefined;

    if (!paymentEntity) {
      this.logger.warn('Razorpay webhook: missing payment entity');
      return;
    }

    const orderId = paymentEntity['order_id'] as string | undefined;
    const amountPaise = paymentEntity['amount'] as number | undefined;

    if (!orderId || !amountPaise) {
      this.logger.warn('Razorpay webhook: missing order_id or amount');
      return;
    }

    await this.finalizePayment(orderId, amountPaise, 'ONLINE');
  }

  private async handleCashfreeEvent(event: Record<string, unknown>): Promise<void> {
    const eventType = event['type'] as string | undefined;

    if (eventType !== 'PAYMENT_SUCCESS') {
      this.logger.log(`Cashfree event ignored: ${eventType}`);
      return;
    }

    const data = event['data'] as Record<string, unknown> | undefined;
    const order = data?.['order'] as Record<string, unknown> | undefined;
    const payment = data?.['payment'] as Record<string, unknown> | undefined;

    const orderId = order?.['order_id'] as string | undefined;
    const amountPaise = payment?.['payment_amount'] != null
      ? Math.round((payment['payment_amount'] as number) * 100)
      : undefined;

    if (!orderId || !amountPaise) {
      this.logger.warn('Cashfree webhook: missing order_id or payment_amount');
      return;
    }

    await this.finalizePayment(orderId, amountPaise, 'ONLINE');
  }

  /**
   * Finds the pending payment record matching a gateway order ID and delegates
   * the full ledger write to FeesService.collectPayment.
   */
  private async finalizePayment(
    gatewayOrderId: string,
    amountPaise: number,
    method: 'ONLINE',
  ): Promise<void> {
    const pending = await this.prisma.payment.findFirst({
      where: { gatewayRef: gatewayOrderId, status: 'PENDING' },
      select: { installmentId: true, centerId: true },
    });

    if (!pending) {
      this.logger.warn(`No pending payment found for gatewayOrderId=${gatewayOrderId}`);
      return;
    }

    const installment = await this.prisma.installment.findUnique({
      where: { id: pending.installmentId },
      select: { enrollmentId: true },
    });

    if (!installment) {
      this.logger.error(`Installment ${pending.installmentId} not found during webhook finalise`);
      return;
    }

    // Delete the provisional PENDING record — collectPayment will create the real one
    await this.prisma.payment.deleteMany({
      where: { gatewayRef: gatewayOrderId, status: 'PENDING' },
    });

    await this.feesService.collectPayment(
      installment.enrollmentId,
      pending.installmentId,
      amountPaise,
      method as any,
      gatewayOrderId,
    );

    this.logger.log(
      `Payment finalised via webhook: gatewayOrderId=${gatewayOrderId} ` +
        `installmentId=${pending.installmentId} amountPaise=${amountPaise}`,
    );
  }
}
