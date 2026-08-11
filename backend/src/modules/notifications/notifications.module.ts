import { Module } from '@nestjs/common';
import { WabaProvider } from './providers/waba.provider';
import { SmsProvider } from './providers/sms.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WabaProvider, SmsProvider],
  exports: [NotificationsService, WabaProvider, SmsProvider],
})
export class NotificationsModule {}
