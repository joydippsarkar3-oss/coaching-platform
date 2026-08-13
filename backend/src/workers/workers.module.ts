import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PdfGenerationWorker } from './pdf-generation.worker';
import { NotificationWorker } from './notification.worker';
import { InstallmentReminderWorker } from './installment-reminder.worker';
import { LedgerReconciliationWorker } from './ledger-reconciliation.worker';
import { ReportExportWorker } from './report-export.worker';
import { PruneWindowsWorker } from './prune-windows.worker';
import { DataRetentionWorker } from './data-retention.worker';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    NotificationsModule,
    BullModule.registerQueue(
      { name: 'pdf-generation' },
      { name: 'notification-dispatch' },
      { name: 'report-export' },
      { name: 'installment-reminder' },
    ),
  ],
  providers: [
    PdfGenerationWorker,
    NotificationWorker,
    InstallmentReminderWorker,
    LedgerReconciliationWorker,
    ReportExportWorker,
    PruneWindowsWorker,
    DataRetentionWorker,
  ],
  exports: [BullModule],
})
export class WorkersModule {}
