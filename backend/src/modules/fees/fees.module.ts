import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { RazorpayProvider } from '../payments/providers/razorpay.provider';
import { CashfreeProvider } from '../payments/providers/cashfree.provider';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'pdf-generation' },
      { name: 'notification-dispatch' },
    ),
  ],
  controllers: [FeesController],
  providers: [FeesService, RazorpayProvider, CashfreeProvider],
  exports: [FeesService],
})
export class FeesModule {}
