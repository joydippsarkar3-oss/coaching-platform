import { NotFoundException } from '@nestjs/common';
import { FeesService } from './fees.service';
import { createPrismaMock } from '../../test/prisma.mock';

// Minimal stubs for payment providers
const mockRazorpay = {
  getSettlementSplit: jest.fn().mockReturnValue({ centerSharePaise: 8000, hoSharePaise: 2000 }),
  createOrder: jest.fn(),
  verifyWebhook: jest.fn(),
};
const mockCashfree = {
  getSettlementSplit: jest.fn().mockReturnValue({ centerSharePaise: 8000, hoSharePaise: 2000 }),
  createOrder: jest.fn(),
  verifyWebhook: jest.fn(),
};

describe('FeesService', () => {
  let service: FeesService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let pdfQueue: { add: jest.Mock };
  let notifQueue: { add: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    pdfQueue = { add: jest.fn() };
    notifQueue = { add: jest.fn() };

    // Ensure razorpay path is taken
    delete process.env.PAYMENT_GATEWAY;

    service = new FeesService(
      prisma as any,
      pdfQueue as any,
      notifQueue as any,
      mockRazorpay as any,
      mockCashfree as any,
    );

    jest.clearAllMocks();
    // Re-stub after clearAllMocks
    mockRazorpay.getSettlementSplit.mockReturnValue({ centerSharePaise: 8000, hoSharePaise: 2000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // collectPayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('collectPayment', () => {
    const ENROLLMENT_ID = 'enroll-1';
    const INSTALLMENT_ID = 'inst-1';
    const AMOUNT = 10_000;
    const PAYMENT_ID = 'pay-abc';

    function setupHappyPath() {
      // $transaction invokes the callback with the mock tx (which is prisma itself)
      prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

      // Lock query returns installment row
      (prisma as any).$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: INSTALLMENT_ID,
          amount_paise: AMOUNT,
          status: 'PENDING',
          center_id: 'center-1',
          enrollment_id: ENROLLMENT_ID,
        },
      ]);

      prisma.center.findUnique.mockResolvedValue({ code: 'DLH01' } as any);

      const payment = { id: PAYMENT_ID, amountPaise: AMOUNT };
      prisma.payment.create.mockResolvedValue(payment as any);
      prisma.ledgerEntry.create.mockResolvedValue({} as any);
      prisma.installment.update.mockResolvedValue({} as any);
      prisma.installment.findMany.mockResolvedValue([
        { status: 'PAID', amountPaise: AMOUNT },
      ] as any);
      prisma.enrollment.update.mockResolvedValue({} as any);

      // Outside transaction: getNextReceiptNo uses $queryRawUnsafe again
      // We need to also handle payment.update for receipt number
      prisma.payment.update.mockResolvedValue({} as any);

      // enrollment lookup for notification
      prisma.enrollment.findUnique.mockResolvedValue({
        id: ENROLLMENT_ID,
        student: { id: 'student-1' },
      } as any);

      return payment;
    }

    it('creates a payment record inside the transaction', async () => {
      setupHappyPath();
      // Override $queryRawUnsafe for both the lock query and getNextReceiptNo
      let callCount = 0;
      (prisma as any).$queryRawUnsafe = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              id: INSTALLMENT_ID,
              amount_paise: AMOUNT,
              status: 'PENDING',
              center_id: 'center-1',
              enrollment_id: ENROLLMENT_ID,
            },
          ]);
        }
        // getNextReceiptNo call
        return Promise.resolve([{ last_receipt_seq: 1, code: 'DLH01' }]);
      });

      await service.collectPayment(ENROLLMENT_ID, INSTALLMENT_ID, AMOUNT, 'CASH' as any);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            installmentId: INSTALLMENT_ID,
            amountPaise: AMOUNT,
            status: 'SUCCESS',
          }),
        }),
      );
    });

    it('creates exactly 2 ledger entries (double-entry invariant)', async () => {
      setupHappyPath();
      let callCount = 0;
      (prisma as any).$queryRawUnsafe = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              id: INSTALLMENT_ID,
              amount_paise: AMOUNT,
              status: 'PENDING',
              center_id: 'center-1',
              enrollment_id: ENROLLMENT_ID,
            },
          ]);
        }
        return Promise.resolve([{ last_receipt_seq: 2, code: 'DLH01' }]);
      });

      await service.collectPayment(ENROLLMENT_ID, INSTALLMENT_ID, AMOUNT, 'CASH' as any);

      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(2);
      const calls = prisma.ledgerEntry.create.mock.calls;
      const types = calls.map((c: any) => c[0].data.type);
      expect(types).toContain('CREDIT');
      expect(types).toContain('DEBIT');
    });

    it('updates installment to PAID on full payment', async () => {
      setupHappyPath();
      let callCount = 0;
      (prisma as any).$queryRawUnsafe = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              id: INSTALLMENT_ID,
              amount_paise: AMOUNT,
              status: 'PENDING',
              center_id: 'center-1',
              enrollment_id: ENROLLMENT_ID,
            },
          ]);
        }
        return Promise.resolve([{ last_receipt_seq: 3, code: 'DLH01' }]);
      });

      await service.collectPayment(ENROLLMENT_ID, INSTALLMENT_ID, AMOUNT, 'CASH' as any);

      expect(prisma.installment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INSTALLMENT_ID },
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });

    it('enqueues a pdf-generation BullMQ job', async () => {
      setupHappyPath();
      let callCount = 0;
      (prisma as any).$queryRawUnsafe = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              id: INSTALLMENT_ID,
              amount_paise: AMOUNT,
              status: 'PENDING',
              center_id: 'center-1',
              enrollment_id: ENROLLMENT_ID,
            },
          ]);
        }
        return Promise.resolve([{ last_receipt_seq: 4, code: 'DLH01' }]);
      });

      await service.collectPayment(ENROLLMENT_ID, INSTALLMENT_ID, AMOUNT, 'CASH' as any);

      expect(pdfQueue.add).toHaveBeenCalledWith(
        'generate',
        expect.objectContaining({ docType: 'RECEIPT' }),
      );
    });

    it('enqueues a notification-dispatch BullMQ job', async () => {
      setupHappyPath();
      let callCount = 0;
      (prisma as any).$queryRawUnsafe = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              id: INSTALLMENT_ID,
              amount_paise: AMOUNT,
              status: 'PENDING',
              center_id: 'center-1',
              enrollment_id: ENROLLMENT_ID,
            },
          ]);
        }
        return Promise.resolve([{ last_receipt_seq: 5, code: 'DLH01' }]);
      });

      await service.collectPayment(ENROLLMENT_ID, INSTALLMENT_ID, AMOUNT, 'CASH' as any);

      expect(notifQueue.add).toHaveBeenCalledWith(
        'dispatch',
        expect.objectContaining({ templateId: 'PAYMENT_RECEIPT' }),
      );
    });

    it('rolls back (propagates error) when prisma.$transaction throws', async () => {
      prisma.$transaction.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.collectPayment(ENROLLMENT_ID, INSTALLMENT_ID, AMOUNT, 'CASH' as any),
      ).rejects.toThrow('DB connection lost');

      // No queue jobs enqueued
      expect(pdfQueue.add).not.toHaveBeenCalled();
      expect(notifQueue.add).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getDuesAging
  // ─────────────────────────────────────────────────────────────────────────

  describe('getDuesAging', () => {
    it('returns correctly parsed bucket values', async () => {
      (prisma as any).$queryRawUnsafe = jest.fn().mockResolvedValue([
        { bucket_0_7: '5000', bucket_8_30: '12000', bucket_31_plus: '30000' },
      ]);

      const result = await service.getDuesAging('center-1');

      expect(result.bucket_0_7).toBe(5000);
      expect(result.bucket_8_30).toBe(12000);
      expect(result.bucket_31_plus).toBe(30000);
    });

    it('returns 0 for all buckets when no overdue installments exist', async () => {
      (prisma as any).$queryRawUnsafe = jest.fn().mockResolvedValue([
        { bucket_0_7: '0', bucket_8_30: '0', bucket_31_plus: '0' },
      ]);

      const result = await service.getDuesAging('center-empty');

      expect(result.bucket_0_7).toBe(0);
      expect(result.bucket_8_30).toBe(0);
      expect(result.bucket_31_plus).toBe(0);
    });

    it('passes centerId to the raw query', async () => {
      (prisma as any).$queryRawUnsafe = jest.fn().mockResolvedValue([
        { bucket_0_7: '0', bucket_8_30: '0', bucket_31_plus: '0' },
      ]);

      await service.getDuesAging('center-xyz');

      expect((prisma as any).$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        'center-xyz',
      );
    });
  });
});
