import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SendNotificationDto } from './dto/notification.dto';
import { NotificationChannel } from '@prisma/client';
import { WabaProvider } from './providers/waba.provider';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waba: WabaProvider,
    private readonly sms: SmsProvider,
    private readonly email: EmailProvider,
  ) {}

  async send(dto: SendNotificationDto, centerId?: string) {
    // Persist the notification record first
    const notification = await this.prisma.notification.create({
      data: {
        centerId: centerId ?? null,
        userId: dto.userId ?? null,
        templateId: dto.templateId ?? null,
        channel: dto.channel,
        recipient: dto.recipient,
        subject: dto.subject ?? null,
        body: dto.body,
        status: 'PENDING',
      },
    });

    // Dispatch via the appropriate stub provider
    try {
      await this.dispatch(dto.channel, dto.recipient, dto.subject ?? null, dto.body);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }

    return notification;
  }

  async findAll(centerId?: string, userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (centerId) where.centerId = centerId;
    if (userId) where.userId = userId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  private async dispatch(
    channel: NotificationChannel,
    recipient: string,
    subject: string | null,
    body: string,
  ): Promise<void> {
    switch (channel) {
      case 'SMS':
        await this.sms.send(recipient, body);
        break;
      case 'WHATSAPP':
        await this.waba.sendText(recipient, body);
        break;
      case 'EMAIL':
        await this.email.send(recipient, subject ?? '', body);
        break;
      case 'PUSH':
        // TODO: wire FCM provider — token stored in recipient field
        this.logger.debug(`[Push stub] Token: ${recipient}`);
        break;
      case 'IN_APP':
        // Delivered via DB read — no external dispatch
        break;
      default:
        this.logger.warn(`Unknown channel: ${channel}`);
    }
  }
}
