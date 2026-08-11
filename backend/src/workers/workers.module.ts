import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PdfGenerationWorker } from './pdf-generation.worker';
import { NotificationWorker } from './notification.worker';
import { InstallmentReminderWorker } from './installment-reminder.worker';
import { LedgerReconciliationWorker } from './ledger-reconciliation.worker';
import { ReportExportWorker } from './report-export.worker';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
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
  ],
  exports: [BullModule],
})
export class WorkersModule {}
