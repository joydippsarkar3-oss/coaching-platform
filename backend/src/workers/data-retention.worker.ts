import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Enforces the data retention schedule documented in engineering/docs/DATA_RETENTION.md.
 *
 * Runs daily at 2 AM. Each purge operation writes an AuditLog entry recording
 * how many rows were removed. Financial records, certificates, and exam evidence
 * are exempt (7-year statutory hold) and are never touched by this worker.
 *
 * The erasure carve-out for subject-rights requests is enforced separately in
 * consent.service.ts — this worker only handles time-based retention.
 */
@Injectable()
export class DataRetentionWorker {
  private readonly logger = new Logger(DataRetentionWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handle() {
    this.logger.log('DataRetentionWorker started');
    const now = new Date();

    try {
      await this.pruneOtpCodes(now);
      await this.pruneNotifications(now);
      await this.pruneWhatsappWindows(now);
      await this.pruneStaleEnquiries(now);
      await this.pruneClosedTickets(now);
      await this.pruneTypingAttempts(now);
      await this.pruneClosedAccounts(now);
      await this.pruneAuditLogs(now);
    } catch (err) {
      this.logger.error('DataRetentionWorker failed', err);
    }
  }

  /** OTP codes: hard delete after 24 hours (they expire at 15 min) */
  private async pruneOtpCodes(now: Date) {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.otpCode.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      this.logger.log(`Pruned ${count} OTP code(s)`);
      await this.audit('OTP_PURGE', count, cutoff);
    }
  }

  /** Marketing/comms logs: 18 months */
  private async pruneNotifications(now: Date) {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 18);

    const { count } = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      this.logger.log(`Pruned ${count} notification(s)`);
      await this.audit('NOTIFICATION_PURGE', count, cutoff);
    }
  }

  /** WhatsApp windows: 18 months (aligned with notifications) */
  private async pruneWhatsappWindows(now: Date) {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 18);

    const { count } = await this.prisma.whatsappWindow.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      this.logger.log(`Pruned ${count} WhatsApp window(s)`);
      await this.audit('WHATSAPP_WINDOW_PURGE', count, cutoff);
    }
  }

  /** Enquiries (non-converted): 24 months from last contact */
  private async pruneStaleEnquiries(now: Date) {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 24);

    // Only delete enquiries that were never converted
    const staleIds = await this.prisma.enquiry.findMany({
      where: {
        updatedAt: { lt: cutoff },
        isConverted: false,
      },
      select: { id: true },
    });

    if (staleIds.length === 0) return;

    await this.prisma.followUp.deleteMany({
      where: { enquiryId: { in: staleIds.map((e) => e.id) } },
    });

    const { count } = await this.prisma.enquiry.deleteMany({
      where: { id: { in: staleIds.map((e) => e.id) } },
    });

    if (count > 0) {
      this.logger.log(`Pruned ${count} stale enquiry/enquiries`);
      await this.audit('ENQUIRY_PURGE', count, cutoff);
    }
  }

  /** Support tickets: 3 years from close */
  private async pruneClosedTickets(now: Date) {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - 3);

    const oldClosedIds = await this.prisma.ticket.findMany({
      where: {
        status: 'CLOSED',
        updatedAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (oldClosedIds.length === 0) return;

    await this.prisma.ticketMessage.deleteMany({
      where: { ticketId: { in: oldClosedIds.map((t) => t.id) } },
    });

    const { count } = await this.prisma.ticket.deleteMany({
      where: { id: { in: oldClosedIds.map((t) => t.id) } },
    });

    if (count > 0) {
      this.logger.log(`Pruned ${count} closed ticket(s)`);
      await this.audit('TICKET_PURGE', count, cutoff);
    }
  }

  /** Typing attempts: 2 years (personal-best rows retained separately if needed) */
  private async pruneTypingAttempts(now: Date) {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - 2);

    const { count } = await this.prisma.typingAttempt.deleteMany({
      where: { startedAt: { lt: cutoff } },
    });

    if (count > 0) {
      this.logger.log(`Pruned ${count} typing attempt(s)`);
      await this.audit('TYPING_ATTEMPT_PURGE', count, cutoff);
    }
  }

  /** Auth accounts: 90 days after closure */
  private async pruneClosedAccounts(now: Date) {
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Accounts marked as closed more than 90 days ago
    const closedUsers = await this.prisma.user.findMany({
      where: {
        isActive: false,
        updatedAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (closedUsers.length === 0) return;

    const userIds = closedUsers.map((u) => u.id);

    await this.prisma.roleAssignment.deleteMany({
      where: { userId: { in: userIds } },
    });

    const { count } = await this.prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    if (count > 0) {
      this.logger.log(`Pruned ${count} closed account(s)`);
      await this.audit('ACCOUNT_PURGE', count, cutoff);
    }
  }

  /** Audit logs: 7 years (same as financial records) */
  private async pruneAuditLogs(now: Date) {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - 7);

    const { count } = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    if (count > 0) {
      this.logger.log(`Pruned ${count} audit log(s)`);
      // Do NOT write an audit entry for purging audit logs — that would recurse.
    }
  }

  private async audit(action: string, rowCount: number, cutoff: Date) {
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        centerId: null,
        action,
        entity: 'DATA_RETENTION',
        entityId: null,
        oldValue: { rowCount, cutoff: cutoff.toISOString() },
      },
    });
  }
}
