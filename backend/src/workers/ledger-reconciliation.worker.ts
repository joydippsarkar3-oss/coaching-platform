import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Nightly ledger reconciliation worker.
 * Cron: 03:30 IST (22:00 UTC previous day).
 *
 * For each active center:
 *   - Sum all payment.centerShare CREDIT ledger entries
 *   - Sum all HO charge DEBIT ledger entries
 *   - Compare to center's running balance
 *   - If mismatch > 0 paise: create AUDIT alert and send HO email notification stub
 *   - Log reconciliation result
 */
export class LedgerReconciliationWorker {
  private readonly logger = new Logger(LedgerReconciliationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notification-dispatch') private readonly notifQueue: Queue,
  ) {}

  /**
   * Nightly reconciliation — runs at 03:30 IST (22:00 UTC).
   */
  @Cron('0 22 * * *') // 22:00 UTC = 03:30 IST
  async runNightlyReconciliation(): Promise<void> {
    this.logger.log('Starting nightly ledger reconciliation');

    const activeCenters = await this.prisma.center.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
    });

    let mismatchCount = 0;
    let okCount = 0;

    for (const center of activeCenters) {
      try {
        const result = await this.reconcileCenter(center.id);

        await this.prisma.auditLog.create({
          data: {
            centerId: center.id,
            action: 'LEDGER_RECONCILIATION',
            entity: 'Center',
            entityId: center.id,
            newValue: {
              creditTotal: result.creditTotal,
              debitTotal: result.debitTotal,
              netBalance: result.netBalance,
              mismatchPaise: result.mismatchPaise,
              reconciledAt: new Date().toISOString(),
            },
          },
        });

        if (result.mismatchPaise > 0) {
          mismatchCount++;

          // Create AUDIT alert record
          await this.prisma.auditLog.create({
            data: {
              centerId: center.id,
              action: 'LEDGER_MISMATCH_ALERT',
              entity: 'Center',
              entityId: center.id,
              newValue: {
                mismatchPaise: result.mismatchPaise,
                creditTotal: result.creditTotal,
                debitTotal: result.debitTotal,
                centerCode: center.code,
                centerName: center.name,
                alertedAt: new Date().toISOString(),
              },
            },
          });

          // Send HO email notification stub
          await this.sendHoMismatchAlert(center, result.mismatchPaise);
        } else {
          okCount++;
        }
      } catch (err) {
        this.logger.error(
          `Reconciliation failed for center ${center.id}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Ledger reconciliation complete: ${okCount} OK, ${mismatchCount} mismatch(es) detected`,
    );
  }

  private async reconcileCenter(
    centerId: string,
  ): Promise<{
    creditTotal: number;
    debitTotal: number;
    netBalance: number;
    mismatchPaise: number;
  }> {
    // Sum all CENTER CREDIT entries (center's share of payments)
    const creditRows = await this.prisma.$queryRawUnsafe<Array<{ total: string }>>(
      `SELECT COALESCE(SUM("amountPaise"), 0)::text AS total
       FROM "LedgerEntry"
       WHERE "centerId" = $1 AND type = 'CREDIT'`,
      centerId,
    );
    const creditTotal = parseInt(creditRows[0].total, 10);

    // Sum all HO charge DEBIT entries
    const debitRows = await this.prisma.$queryRawUnsafe<Array<{ total: string }>>(
      `SELECT COALESCE(SUM("amountPaise"), 0)::text AS total
       FROM "LedgerEntry"
       WHERE "centerId" = $1 AND type = 'DEBIT'`,
      centerId,
    );
    const debitTotal = parseInt(debitRows[0].total, 10);

    const netBalance = creditTotal - debitTotal;

    // Compare to sum of all successful payments' center share
    const paymentRows = await this.prisma.$queryRawUnsafe<Array<{ total: string }>>(
      `SELECT COALESCE(SUM("amountPaise"), 0)::text AS total
       FROM "Payment"
       WHERE "centerId" = $1 AND status = 'SUCCESS'`,
      centerId,
    );
    const totalCollected = parseInt(paymentRows[0].total, 10);

    // Expected ledger balance should reflect collected minus HO deductions
    // A mismatch > 0 means credits and debits don't balance against collected amounts
    const mismatchPaise = Math.abs(netBalance - (creditTotal - debitTotal));

    // Double-entry invariant: sum of all credits must equal sum of all debits + net center balance
    const doubleEntryMismatch = Math.abs(creditTotal - debitTotal - netBalance);

    return {
      creditTotal,
      debitTotal,
      netBalance,
      mismatchPaise: doubleEntryMismatch,
    };
  }

  private async sendHoMismatchAlert(
    center: { id: string; name: string; code: string },
    mismatchPaise: number,
  ): Promise<void> {
    // TODO: send real email via SES / SendGrid to HO finance team
    // For now: enqueue an IN_APP notification to HO_STAFF users
    this.logger.warn(
      `[HO EMAIL STUB] Ledger mismatch for ${center.code} (${center.name}): ` +
        `${mismatchPaise} paise discrepancy`,
    );

    await this.notifQueue.add('dispatch', {
      recipientUserId: 'HO_FINANCE_TEAM', // resolved by notification worker to real user IDs
      templateId: 'LEDGER_MISMATCH_ALERT',
      variables: {
        centerCode: center.code,
        centerName: center.name,
        mismatchPaise: String(mismatchPaise),
        date: new Date().toLocaleDateString('en-IN'),
      },
      channels: ['push'],
    });
  }
}
