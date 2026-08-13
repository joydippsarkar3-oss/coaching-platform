import { Module } from '@nestjs/common';
import { WabaProvider } from './providers/waba.provider';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';
import { FcmProvider } from './providers/fcm.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsappWindowService } from './whatsapp-window.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    WabaProvider,
    SmsProvider,
    EmailProvider,
    FcmProvider,
    WhatsappWindowService,
  ],
  exports: [
    NotificationsService,
    WabaProvider,
    SmsProvider,
    EmailProvider,
    FcmProvider,
    WhatsappWindowService,
  ],
})
export class NotificationsModule {}
