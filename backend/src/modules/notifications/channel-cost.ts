import { NotificationChannel } from '@prisma/client';

/**
 * Per-message cost in paise, used to attribute communications spend to the
 * center that triggered the send.
 *
 * These are list prices and change whenever a gateway repricing lands, so each
 * one is overridable by env without a deploy. WhatsApp is priced per
 * *conversation* rather than per message by Meta — inside an open 24-hour
 * window follow-up messages are free, so WHATSAPP_COST_PAISE is charged only on
 * the message that opens a conversation (see NotificationsService.send).
 */
export interface ChannelCosts {
  sms: number;
  whatsappConversation: number;
  email: number;
  push: number;
}

const int = (raw: string | undefined, fallback: number): number => {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function loadChannelCosts(env: NodeJS.ProcessEnv = process.env): ChannelCosts {
  return {
    // DLT-registered transactional SMS, ~₹0.18/msg
    sms: int(env.SMS_COST_PAISE, 18),
    // Meta utility conversation in India, ~₹0.35
    whatsappConversation: int(env.WHATSAPP_COST_PAISE, 35),
    // SES-class pricing, effectively ~₹0.01
    email: int(env.EMAIL_COST_PAISE, 1),
    // FCM is free
    push: int(env.PUSH_COST_PAISE, 0),
  };
}

/**
 * Cost of a single send. `opensConversation` only affects WhatsApp: follow-ups
 * inside an already-open window cost nothing.
 */
export function costForSend(
  channel: NotificationChannel,
  costs: ChannelCosts,
  opensConversation = true,
): number {
  switch (channel) {
    case 'SMS':
      return costs.sms;
    case 'WHATSAPP':
      return opensConversation ? costs.whatsappConversation : 0;
    case 'EMAIL':
      return costs.email;
    case 'PUSH':
      return costs.push;
    case 'IN_APP':
      return 0;
    default:
      return 0;
  }
}
