import { Module } from '@nestjs/common';
import { WabaProvider } from './providers/waba.provider';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';
import { FcmProvider } from './providers/fcm.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WabaProvider, SmsProvider, EmailProvider, FcmProvider],
  exports: [NotificationsService, WabaProvider, SmsProvider, EmailProvider, FcmProvider],
})
export class NotificationsModule {}
