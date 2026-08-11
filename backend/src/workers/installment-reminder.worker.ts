import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Installment reminder worker.
 * Cron: nightly at 02:00 IST (UTC+5:30 = 20:30 UTC previous day).
 *
 * Reminder ladder:
 *   DUE_3D    — due in 3 days
 *   DUE_TODAY — due today
 *   OVERDUE_3D — 3 days overdue
 *   OVERDUE_7D — 7 days overdue
 *   +14d overdue — create a center dashboard task (no notification)
 *
 * Deduplication: skip if a reminder was already sent for this
 * installment + ladder_step in the last 20 hours.
 */

type ReminderStep = 'DUE_3D' | 'DUE_TODAY' | 'OVERDUE_3D' | 'OVERDUE_7D';

@Processor('installment-reminder')
export class InstallmentReminderWorker {
  private readonly logger = new Logger(InstallmentReminderWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notification-dispatch') private readonly notifQueue: Queue,
  ) {}

  /**
   * Nightly reminder cron — runs at 02:00 IST (20:30 UTC).
   * Finds installments at each ladder step and enqueues notification jobs,
   * with deduplication to prevent double-sending within a 20h window.
   */
  @Cron('30 20 * * *') // 20:30 UTC = 02:00 IST
  async runNightlyReminders(): Promise<void> {
    this.logger.log('Starting nightly installment reminders');

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1_000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1_000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1_000);

    const steps: Array<{ step: ReminderStep; from: Date; to: Date }> = [
      {
        step: 'DUE_3D',
        from: new Date(threeDaysFromNow.getTime()),
        to: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1_000 - 1),
      },
      { step: 'DUE_TODAY', from: todayStart, to: todayEnd },
      {
        step: 'OVERDUE_3D',
        from: new Date(threeDaysAgo.getTime()),
        to: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1_000 - 1),
      },
      {
        step: 'OVERDUE_7D',
        from: new Date(sevenDaysAgo.getTime()),
        to: new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1_000 - 1),
      },
    ];

    let enqueued = 0;
    let skipped = 0;

    for (const { step, from, to } of steps) {
      const installments = await this.prisma.installment.findMany({
        where: {
          dueDate: { gte: from, lte: to },
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        include: {
          enrollment: {
            include: {
              student: { select: { id: true, name: true } },
            },
          },
        },
      });

      for (const inst of installments) {
        const isDupe = await this.isRecentlySent(inst.id, step);
        if (isDupe) {
          skipped++;
          continue;
        }

        const studentId = inst.enrollment.student.id;
        const studentName = inst.enrollment.student.name;

        await this.notifQueue.add('dispatch', {
          recipientUserId: studentId,
          templateId: `INSTALLMENT_${step}`,
          variables: {
            studentName,
            dueDate: inst.dueDate.toLocaleDateString('en-IN'),
            amountPaise: String(inst.amountPaise),
            installmentId: inst.id,
            step,
          },
          channels: ['push', 'whatsapp', 'sms'],
        });

        // Record that this reminder was sent (for deduplication)
        await this.prisma.auditLog.create({
          data: {
            centerId: inst.centerId,
            action: 'REMINDER_SENT',
            entity: 'Installment',
            entityId: inst.id,
            newValue: { step, sentAt: new Date().toISOString() },
          },
        });

        enqueued++;
      }
    }

    // +14d overdue: create center dashboard task (no notification)
    const overdueBy14 = await this.prisma.installment.findMany({
      where: {
        dueDate: { lte: fourteenDaysAgo },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: {
        enrollment: { select: { centerId: true, studentId: true } },
      },
    });

    for (const inst of overdueBy14) {
      const alreadyTasked = await this.prisma.auditLog.findFirst({
        where: {
          entity: 'Installment',
          entityId: inst.id,
          action: 'OVERDUE_TASK_CREATED',
        },
      });
      if (alreadyTasked) continue;

      // Update center notification feed with a dashboard task
      await this.prisma.notification.create({
        data: {
          centerId: inst.enrollment.centerId,
          channel: 'IN_APP',
          recipient: inst.enrollment.centerId ?? 'center',
          subject: 'Overdue Installment — Action Required',
          body: `Installment ${inst.id} is more than 14 days overdue (${inst.amountPaise} paise). Please follow up with the student.`,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          centerId: inst.centerId,
          action: 'OVERDUE_TASK_CREATED',
          entity: 'Installment',
          entityId: inst.id,
          newValue: { createdAt: new Date().toISOString() },
        },
      });
    }

    this.logger.log(
      `Nightly reminders complete: ${enqueued} enqueued, ${skipped} skipped (deduplication), ` +
        `${overdueBy14.length} 14d-overdue tasks processed`,
    );
  }

  /**
   * Checks whether a reminder for this installment+step was already sent
   * within the last 20 hours.
   */
  private async isRecentlySent(installmentId: string, step: ReminderStep): Promise<boolean> {
    const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1_000);
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        entity: 'Installment',
        entityId: installmentId,
        action: 'REMINDER_SENT',
        createdAt: { gte: cutoff },
        newValue: { path: ['step'], equals: step },
      },
    });
    return existing !== null;
  }
}
