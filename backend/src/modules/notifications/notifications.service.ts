import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SendNotificationDto } from './dto/notification.dto';
import { WabaProvider } from './providers/waba.provider';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';
import { FcmProvider } from './providers/fcm.provider';
import { WhatsappWindowService } from './whatsapp-window.service';
import { ChannelCosts, costForSend, loadChannelCosts } from './channel-cost';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly costs: ChannelCosts = loadChannelCosts();

  constructor(
    private readonly prisma: PrismaService,
    private readonly waba: WabaProvider,
    private readonly sms: SmsProvider,
    private readonly email: EmailProvider,
    private readonly fcm: FcmProvider,
    private readonly window: WhatsappWindowService,
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

    try {
      // WhatsApp is billed per conversation: a send inside an already-open
      // window is free, so the window state decides both the transport
      // (free-form vs template) and the cost attributed to the center.
      const windowOpen =
        dto.channel === 'WHATSAPP'
          ? await this.window.isOpen(dto.recipient)
          : false;

      await this.dispatch(dto, windowOpen);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          costPaise: costForSend(dto.channel, this.costs, !windowOpen),
        },
      });
    } catch (err) {
      // A failed send is not billed.
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }

    return notification;
  }

  /**
   * Communications spend for a center over a date range, split by channel.
   * Only SENT messages are counted — failures are not billed.
   */
  async getCostSummary(centerId?: string, from?: Date, to?: Date) {
    const where = {
      status: 'SENT' as const,
      ...(centerId ? { centerId } : {}),
      ...(from || to
        ? { sentAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    const grouped = await this.prisma.notification.groupBy({
      by: ['channel'],
      where,
      _sum: { costPaise: true },
      _count: { _all: true },
    });

    const byChannel = grouped.map((g) => ({
      channel: g.channel,
      messages: g._count._all,
      costPaise: g._sum.costPaise ?? 0,
    }));

    return {
      centerId: centerId ?? null,
      from: from ?? null,
      to: to ?? null,
      totalCostPaise: byChannel.reduce((sum, c) => sum + c.costPaise, 0),
      totalMessages: byChannel.reduce((sum, c) => sum + c.messages, 0),
      byChannel,
    };
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

  async getWhatsappWindow(phone: string) {
    const state = await this.window.getState(phone);
    return {
      phone: this.window.constructor.name === 'WhatsappWindowService'
        ? (this.window as any).constructor.normalize?.(phone) ?? phone
        : phone,
      isOpen: state.isOpen,
      expiresAt: state.expiresAt,
    };
  }

  private async dispatch(dto: SendNotificationDto, windowOpen: boolean): Promise<void> {
    const { channel, recipient, body } = dto;
    const subject = dto.subject ?? null;

    switch (channel) {
      case 'SMS':
        await this.sms.send(recipient, body);
        break;
      case 'WHATSAPP':
        await this.dispatchWhatsApp(dto, windowOpen);
        break;
      case 'EMAIL':
        await this.email.send(recipient, subject ?? '', body);
        break;
      case 'PUSH':
        // recipient field carries the FCM device registration token
        await this.fcm.sendToDevice(recipient, subject ?? '', body);
        break;
      case 'IN_APP':
        // Delivered via DB read — no external dispatch
        break;
      default:
        this.logger.warn(`Unknown channel: ${channel}`);
    }
  }

  /**
   * Inside an open 24-hour window free-form text is allowed. Outside it Meta
   * only accepts a pre-approved template, so a send with no template name would
   * be rejected by the API — fail fast with a clear reason instead.
   */
  private async dispatchWhatsApp(
    dto: SendNotificationDto,
    windowOpen: boolean,
  ): Promise<void> {
    if (windowOpen) {
      await this.waba.sendText(dto.recipient, dto.body);
      return;
    }

    if (!dto.templateName) {
      throw new BadRequestException(
        `WhatsApp service window for ${dto.recipient} is closed. ` +
          'Provide templateName (a Meta-approved template) to send outside the 24-hour window.',
      );
    }

    await this.waba.sendTemplate(
      dto.recipient,
      dto.templateName,
      dto.templateLang ?? 'en',
      dto.templateComponents ?? [],
    );
  }
}
