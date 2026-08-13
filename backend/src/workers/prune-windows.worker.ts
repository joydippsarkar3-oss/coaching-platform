import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsappWindowService } from '../modules/notifications/whatsapp-window.service';

/**
 * Prunes expired WhatsApp service windows daily.
 *
 * Windows older than 24 hours cannot be used for free-form messaging, and
 * keeping them indefinitely bloats the table. This worker runs once daily
 * and removes all windows whose expiresAt is more than 24 hours in the past.
 */
@Injectable()
export class PruneWindowsWorker {
  private readonly logger = new Logger(PruneWindowsWorker.name);

  constructor(private readonly window: WhatsappWindowService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handle() {
    this.logger.log('PruneWindowsWorker started');
    try {
      const count = await this.window.pruneExpired();
      if (count > 0) {
        this.logger.log(`Pruned ${count} expired WhatsApp window(s)`);
      }
    } catch (err) {
      this.logger.error('PruneWindowsWorker failed', err);
    }
  }
}
