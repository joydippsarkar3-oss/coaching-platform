import { NotificationChannel } from '@prisma/client';
import { loadChannelCosts, costForSend } from './channel-cost';

describe('channel-cost', () => {
  describe('loadChannelCosts', () => {
    it('loads defaults when env vars are missing', () => {
      const costs = loadChannelCosts({});
      expect(costs).toEqual({
        sms: 18,
        whatsappConversation: 35,
        email: 1,
        push: 0,
      });
    });

    it('parses env vars when present', () => {
      const costs = loadChannelCosts({
        SMS_COST_PAISE: '20',
        WHATSAPP_COST_PAISE: '40',
        EMAIL_COST_PAISE: '2',
        PUSH_COST_PAISE: '0',
      });
      expect(costs).toEqual({
        sms: 20,
        whatsappConversation: 40,
        email: 2,
        push: 0,
      });
    });

    it('ignores invalid or negative values', () => {
      const costs = loadChannelCosts({
        SMS_COST_PAISE: 'not-a-number',
        WHATSAPP_COST_PAISE: '-10',
        EMAIL_COST_PAISE: '3.5',
      });
      expect(costs.sms).toBe(18); // fallback
      expect(costs.whatsappConversation).toBe(35); // fallback (negative rejected)
      expect(costs.email).toBe(3); // parseInt truncates
    });
  });

  describe('costForSend', () => {
    const costs = {
      sms: 18,
      whatsappConversation: 35,
      email: 1,
      push: 0,
    };

    it('returns SMS cost', () => {
      expect(costForSend('SMS' as NotificationChannel, costs)).toBe(18);
    });

    it('returns WhatsApp conversation cost when opening a new window', () => {
      expect(costForSend('WHATSAPP' as NotificationChannel, costs, true)).toBe(35);
    });

    it('returns 0 for WhatsApp when window is already open', () => {
      expect(costForSend('WHATSAPP' as NotificationChannel, costs, false)).toBe(0);
    });

    it('returns EMAIL cost', () => {
      expect(costForSend('EMAIL' as NotificationChannel, costs)).toBe(1);
    });

    it('returns PUSH cost (0)', () => {
      expect(costForSend('PUSH' as NotificationChannel, costs)).toBe(0);
    });

    it('returns 0 for IN_APP', () => {
      expect(costForSend('IN_APP' as NotificationChannel, costs)).toBe(0);
    });

    it('returns 0 for unknown channels', () => {
      expect(costForSend('UNKNOWN' as any, costs)).toBe(0);
    });
  });
});
