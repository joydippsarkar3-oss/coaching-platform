import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** How long a customer-initiated WhatsApp service window stays open. */
export const WINDOW_DURATION_MS = 24 * 60 * 60 * 1_000;

export interface WindowState {
  isOpen: boolean;
  expiresAt: Date | null;
}

/**
 * Tracks Meta's 24-hour customer service window per phone number.
 *
 * Meta only permits free-form text to a user inside a window opened by *their*
 * inbound message. Outside it, an outbound message must use a pre-approved
 * template or the API rejects it. This service is the single source of truth for
 * which of the two applies, so the send path never has to guess.
 */
@Injectable()
export class WhatsappWindowService {
  private readonly logger = new Logger(WhatsappWindowService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Normalizes to a bare MSISDN so lookups match regardless of input format. */
  static normalize(phone: string): string {
    return phone.replace(/^\+/, '').replace(/[\s-]/g, '');
  }

  /**
   * Opens or extends the window for an inbound message. Called by the WhatsApp
   * webhook — each inbound message resets the 24-hour clock.
   */
  async recordInbound(phone: string, centerId?: string | null, now = new Date()) {
    const msisdn = WhatsappWindowService.normalize(phone);
    const expiresAt = new Date(now.getTime() + WINDOW_DURATION_MS);

    return this.prisma.whatsappWindow.upsert({
      where: { phone: msisdn },
      update: {
        lastMsgAt: now,
        expiresAt,
        msgCount: { increment: 1 },
        ...(centerId ? { centerId } : {}),
      },
      create: {
        phone: msisdn,
        centerId: centerId ?? null,
        openedAt: now,
        expiresAt,
        lastMsgAt: now,
        msgCount: 1,
      },
    });
  }

  /** Whether free-form text may be sent to this number right now. */
  async getState(phone: string, now = new Date()): Promise<WindowState> {
    const msisdn = WhatsappWindowService.normalize(phone);
    const window = await this.prisma.whatsappWindow.findUnique({
      where: { phone: msisdn },
      select: { expiresAt: true },
    });

    if (!window) return { isOpen: false, expiresAt: null };
    return {
      isOpen: window.expiresAt.getTime() > now.getTime(),
      expiresAt: window.expiresAt,
    };
  }

  async isOpen(phone: string, now = new Date()): Promise<boolean> {
    return (await this.getState(phone, now)).isOpen;
  }

  /**
   * Drops windows that expired more than a day ago. Retaining them serves no
   * purpose — a closed window is indistinguishable from never having had one.
   */
  async pruneExpired(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - WINDOW_DURATION_MS);
    const { count } = await this.prisma.whatsappWindow.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });
    if (count > 0) this.logger.log(`Pruned ${count} expired WhatsApp window(s)`);
    return count;
  }
}
