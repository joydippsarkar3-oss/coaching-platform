import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RazorpayProvider } from './providers/razorpay.provider';
import { CashfreeProvider } from './providers/cashfree.provider';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [
    PrismaModule,
    FeesModule,
    BullModule.registerQueue(
      { name: 'pdf-generation' },
      { name: 'notification-dispatch' },
    ),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayProvider, CashfreeProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
