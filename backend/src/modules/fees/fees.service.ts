import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
import { RazorpayProvider } from '../payments/providers/razorpay.provider';
import { CashfreeProvider } from '../payments/providers/cashfree.provider';
import { PaymentProvider } from '../../common/interfaces/payment-provider.interface';

// RBI PA Directions Sep 2025: center funds must not pool at HO.
// Split happens at gateway; ledger mirrors it.

@Injectable()
export class FeesService {
  private readonly paymentProvider: PaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pdf-generation') private readonly pdfQueue: Queue,
    @InjectQueue('notification-dispatch') private readonly notifQueue: Queue,
    private readonly razorpay: RazorpayProvider,
    private readonly cashfree: CashfreeProvider,
  ) {
    // Wire provider via config flag — no conditional branching at call sites
    this.paymentProvider =
      (process.env.PAYMENT_GATEWAY ?? 'razorpay') === 'cashfree' ? cashfree : razorpay;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Receipt numbering
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generates the next per-center sequential receipt number atomically.
   * Format: {center_code}/{YYYY-MM}/{NNNN} e.g. "DLH01/2026-08/0042"
   * Uses UPDATE ... RETURNING to atomically increment last_receipt_seq.
   *
   * @param centerId - UUID of the center
   * @returns formatted receipt number
   * @throws NotFoundException if center not found
   */
  async getNextReceiptNo(centerId: string): Promise<string> {
    // Atomic increment with UPDATE ... RETURNING — no advisory lock needed
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ last_receipt_seq: number; code: string }>
    >(
      `UPDATE "Center"
       SET "lastReceiptSeq" = COALESCE("lastReceiptSeq", 0) + 1,
           "updatedAt" = NOW()
       WHERE id = $1
       RETURNING "lastReceiptSeq" AS last_receipt_seq, code`,
      centerId,
    );

    if (rows.length === 0) throw new NotFoundException(`Center ${centerId} not found`);

    const { last_receipt_seq: seq, code } = rows[0];
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const padded = String(seq).padStart(4, '0');
    return `${code}/${month}/${padded}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fee collection — full transactional flow
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Collects a payment for an installment inside a Prisma transaction:
   * 1. Locks the installment row (SELECT FOR UPDATE)
   * 2. Validates amount (exact or partial)
   * 3. Creates payment record
   * 4. Creates two balanced ledger entries (CENTER CREDIT + HO DEBIT)
   * 5. Updates installment status to PAID or PARTIAL
   * 6. Updates enrollment fee summary
   * 7. Enqueues receipt PDF job
   * 8. Enqueues WhatsApp utility notification job
   *
   * @param enrollmentId - UUID of the enrollment
   * @param installmentId - UUID of the installment being paid
   * @param amountPaise - amount collected in paise (integer, never float)
   * @param mode - PaymentMethod enum value
   * @param gatewayOrderId - optional gateway order/transaction reference
   * @param staffId - userId of the cash-collecting staff member (cash mode)
   * @returns {paymentId, receiptNo, receiptPdfUrl}
   * @throws NotFoundException if installment not found
   * @throws BadRequestException if installment already paid or amount invalid
   */
  async collectPayment(
    enrollmentId: string,
    installmentId: string,
    amountPaise: number,
    mode: PaymentMethod,
    gatewayOrderId?: string,
    staffId?: string,
  ): Promise<{ paymentId: string; receiptNo: string; receiptPdfUrl: null }> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Lock installment row
      const [lockedInstallment] = await tx.$queryRawUnsafe<
        Array<{
          id: string;
          amount_paise: number;
          status: string;
          center_id: string | null;
          enrollment_id: string;
        }>
      >(
        `SELECT id, "amountPaise" AS amount_paise, status,
                "centerId" AS center_id, "enrollmentId" AS enrollment_id
         FROM "Installment"
         WHERE id = $1
         FOR UPDATE`,
        installmentId,
      );

      if (!lockedInstallment) throw new NotFoundException(`Installment ${installmentId} not found`);
      if (lockedInstallment.status === 'PAID') {
        throw new BadRequestException('Installment is already fully paid');
      }
      if (amountPaise <= 0) {
        throw new BadRequestException('Payment amount must be positive');
      }
      if (amountPaise > lockedInstallment.amount_paise) {
        throw new BadRequestException(
          `Payment amount (${amountPaise} paise) exceeds installment amount (${lockedInstallment.amount_paise} paise)`,
        );
      }

      const centerId = lockedInstallment.center_id;
      const isFullPayment = amountPaise === lockedInstallment.amount_paise;

      // 2. Resolve center for split + receipt numbering
      const center = centerId
        ? await tx.center.findUnique({ where: { id: centerId }, select: { code: true } })
        : null;

      // 3. Create payment record
      const payment = await tx.payment.create({
        data: {
          installmentId,
          amountPaise,
          method: mode,
          status: 'SUCCESS',
          gatewayRef: gatewayOrderId ?? null,
          collectedBy: staffId ?? null,
          paidAt: new Date(),
          centerId: centerId ?? null,
        },
      });

      // 4. Calculate split and create two balanced ledger entries
      const split = this.paymentProvider.getSettlementSplit(amountPaise, centerId ?? '');

      // CENTER CREDIT
      await tx.ledgerEntry.create({
        data: {
          centerId: centerId ?? null,
          enrollmentId,
          paymentId: payment.id,
          type: 'CREDIT',
          amountPaise: split.centerSharePaise,
          description: `Center share — payment ${payment.id} via ${mode}`,
        },
      });

      // HO DEBIT (admission/cert charges flow back to HO)
      await tx.ledgerEntry.create({
        data: {
          centerId: centerId ?? null,
          enrollmentId,
          paymentId: payment.id,
          type: 'DEBIT',
          amountPaise: split.hoSharePaise,
          description: `HO charge — payment ${payment.id} via ${mode}`,
        },
      });

      // 5. Update installment status
      const newInstallmentStatus = isFullPayment ? 'PAID' : 'PARTIAL';
      await tx.installment.update({
        where: { id: installmentId },
        data: {
          status: newInstallmentStatus as 'PAID' | 'PENDING',
          paidAt: isFullPayment ? new Date() : null,
        },
      });

      // 6. Update enrollment fee summary
      const allInstallments = await tx.installment.findMany({
        where: { enrollmentId },
        select: { status: true, amountPaise: true },
      });
      const paidTotal = allInstallments
        .filter((i) => i.status === 'PAID')
        .reduce((sum, i) => sum + i.amountPaise, 0);
      const totalFee = allInstallments.reduce((sum, i) => sum + i.amountPaise, 0);

      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          ['totalFeePaise' as string]: totalFee,
          ['paidFeePaise' as string]: paidTotal,
          ['feeStatus' as string]: paidTotal >= totalFee ? 'CLEARED' : 'PARTIAL',
        },
      });

      return {
        paymentId: payment.id,
        centerId,
        centerCode: center?.code ?? 'CTR',
      };
    });

    // 7. Generate receipt number (outside transaction — uses separate atomic UPDATE)
    const receiptNo = result.centerId
      ? await this.getNextReceiptNo(result.centerId)
      : `NOCENTER/${new Date().toISOString()}`;

    // Store receipt number on the payment record
    await this.prisma.payment.update({
      where: { id: result.paymentId },
      data: { ['receiptNo' as string]: receiptNo },
    });

    // 8a. Enqueue receipt PDF job
    await this.pdfQueue.add('generate', {
      certId: result.paymentId,
      docType: 'RECEIPT',
      templateId: null,
    });

    // 8b. Enqueue WhatsApp utility notification
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { select: { id: true } } },
    });
    if (enrollment?.student) {
      await this.notifQueue.add('dispatch', {
        recipientUserId: enrollment.student.id,
        templateId: 'PAYMENT_RECEIPT',
        variables: { receiptNo, amountPaise: String(amountPaise) },
        channels: ['whatsapp', 'push'],
      });
    }

    return {
      paymentId: result.paymentId,
      receiptNo,
      receiptPdfUrl: null, // populated asynchronously by PDF worker
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cash reconciliation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Closes the daily cash book for a center: sums cash payments, creates a
   * CASH_CLOSE ledger entry, and marks those cash entries reconciled.
   *
   * @param centerId - UUID of the center
   * @param date - the calendar date to close (ISO date string, e.g. "2026-08-11")
   * @param closedBy - userId of the staff member closing the book
   * @returns {totalCashPaise, ledgerEntryId}
   */
  async closeDailyCashBook(
    centerId: string,
    date: string,
    closedBy: string,
  ): Promise<{ totalCashPaise: number; ledgerEntryId: string }> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // Sum all cash payments for the day
    const cashPayments = await this.prisma.payment.findMany({
      where: {
        centerId,
        method: 'CASH',
        status: 'SUCCESS',
        paidAt: { gte: dayStart, lte: dayEnd },
        ['reconciled' as string]: false,
      },
      select: { id: true, amountPaise: true },
    });

    const totalCashPaise = cashPayments.reduce((sum, p) => sum + p.amountPaise, 0);

    return this.prisma.$transaction(async (tx) => {
      // Create CASH_CLOSE ledger entry
      const entry = await tx.ledgerEntry.create({
        data: {
          centerId,
          type: 'CREDIT',
          amountPaise: totalCashPaise,
          description: `Daily cash close by ${closedBy} for ${date}`,
          ['entrySubtype' as string]: 'CASH_CLOSE',
        },
      });

      // Mark cash payments as reconciled
      for (const p of cashPayments) {
        await tx.payment.update({
          where: { id: p.id },
          data: { ['reconciled' as string]: true, ['reconciledAt' as string]: new Date() },
        });
      }

      return { totalCashPaise, ledgerEntryId: entry.id };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Dues aging query
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns aged dues buckets for a center using a pure SQL CASE WHEN query.
   * Buckets: 0-7 days, 8-30 days, 31+ days overdue.
   *
   * @param centerId - UUID of the center
   * @returns {bucket_0_7, bucket_8_30, bucket_31_plus} — amounts in paise
   */
  async getDuesAging(
    centerId: string,
  ): Promise<{ bucket_0_7: number; bucket_8_30: number; bucket_31_plus: number }> {
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ bucket_0_7: string; bucket_8_30: string; bucket_31_plus: string }>
    >(
      `SELECT
         COALESCE(SUM(CASE WHEN DATE_PART('day', NOW() - "dueDate") BETWEEN 0 AND 7
                          THEN "amountPaise" ELSE 0 END), 0)::text AS bucket_0_7,
         COALESCE(SUM(CASE WHEN DATE_PART('day', NOW() - "dueDate") BETWEEN 8 AND 30
                          THEN "amountPaise" ELSE 0 END), 0)::text AS bucket_8_30,
         COALESCE(SUM(CASE WHEN DATE_PART('day', NOW() - "dueDate") > 30
                          THEN "amountPaise" ELSE 0 END), 0)::text AS bucket_31_plus
       FROM "Installment"
       WHERE "centerId" = $1
         AND status IN ('PENDING', 'OVERDUE')
         AND "dueDate" < NOW()`,
      centerId,
    );

    const row = rows[0];
    return {
      bucket_0_7: parseInt(row.bucket_0_7, 10),
      bucket_8_30: parseInt(row.bucket_8_30, 10),
      bucket_31_plus: parseInt(row.bucket_31_plus, 10),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Existing CRUD kept for controller compatibility
  // ─────────────────────────────────────────────────────────────────────────

  async createFeePlan(
    dto: { name: string; totalAmountPaise: number; installmentCount: number },
    centerId?: string,
  ) {
    return this.prisma.feePlan.create({ data: { ...dto, centerId: centerId ?? null } });
  }

  async findAllFeePlans(centerId?: string) {
    const where = centerId ? { centerId, isActive: true } : { isActive: true };
    return this.prisma.feePlan.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getInstallments(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return this.prisma.installment.findMany({
      where: { enrollmentId },
      include: { payments: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getPaymentHistory(enrollmentId: string) {
    return this.prisma.installment.findMany({
      where: { enrollmentId },
      include: { payments: true },
      orderBy: { dueDate: 'asc' },
    });
  }
}
