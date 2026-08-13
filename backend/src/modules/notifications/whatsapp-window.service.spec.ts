import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappWindowService, WINDOW_DURATION_MS } from './whatsapp-window.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('WhatsappWindowService', () => {
  let service: WhatsappWindowService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappWindowService,
        {
          provide: PrismaService,
          useValue: {
            whatsappWindow: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WhatsappWindowService>(WhatsappWindowService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('normalize', () => {
    it('strips leading + and whitespace/hyphens', () => {
      expect(WhatsappWindowService.normalize('+91 98765-43210')).toBe('919876543210');
      expect(WhatsappWindowService.normalize('919876543210')).toBe('919876543210');
    });
  });

  describe('recordInbound', () => {
    it('upserts a window with 24-hour expiry', async () => {
      const now = new Date('2025-01-15T10:00:00Z');
      const expiresAt = new Date(now.getTime() + WINDOW_DURATION_MS);

      (prisma.whatsappWindow.upsert as jest.Mock).mockResolvedValue({
        id: 'w1',
        phone: '919876543210',
        expiresAt,
      });

      await service.recordInbound('+91 98765-43210', 'c1', now);

      expect(prisma.whatsappWindow.upsert).toHaveBeenCalledWith({
        where: { phone: '919876543210' },
        update: {
          lastMsgAt: now,
          expiresAt,
          msgCount: { increment: 1 },
          centerId: 'c1',
        },
        create: {
          phone: '919876543210',
          centerId: 'c1',
          openedAt: now,
          expiresAt,
          lastMsgAt: now,
          msgCount: 1,
        },
      });
    });

    it('omits centerId when null', async () => {
      const now = new Date();
      (prisma.whatsappWindow.upsert as jest.Mock).mockResolvedValue({});

      await service.recordInbound('919876543210', null, now);

      const call = (prisma.whatsappWindow.upsert as jest.Mock).mock.calls[0][0];
      expect(call.update).not.toHaveProperty('centerId');
      expect(call.create.centerId).toBeNull();
    });
  });

  describe('getState', () => {
    it('returns open when window has not expired', async () => {
      const now = new Date('2025-01-15T10:00:00Z');
      const expiresAt = new Date('2025-01-16T10:00:00Z');

      (prisma.whatsappWindow.findUnique as jest.Mock).mockResolvedValue({ expiresAt });

      const state = await service.getState('919876543210', now);

      expect(state).toEqual({ isOpen: true, expiresAt });
    });

    it('returns closed when window has expired', async () => {
      const now = new Date('2025-01-16T10:00:01Z');
      const expiresAt = new Date('2025-01-16T10:00:00Z');

      (prisma.whatsappWindow.findUnique as jest.Mock).mockResolvedValue({ expiresAt });

      const state = await service.getState('919876543210', now);

      expect(state).toEqual({ isOpen: false, expiresAt });
    });

    it('returns closed when no window exists', async () => {
      (prisma.whatsappWindow.findUnique as jest.Mock).mockResolvedValue(null);

      const state = await service.getState('919876543210');

      expect(state).toEqual({ isOpen: false, expiresAt: null });
    });
  });

  describe('isOpen', () => {
    it('returns boolean from getState', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1000);

      (prisma.whatsappWindow.findUnique as jest.Mock).mockResolvedValue({ expiresAt });

      expect(await service.isOpen('919876543210', now)).toBe(true);
    });
  });

  describe('pruneExpired', () => {
    it('deletes windows older than 24 hours', async () => {
      const now = new Date('2025-01-16T10:00:00Z');
      const cutoff = new Date(now.getTime() - WINDOW_DURATION_MS);

      (prisma.whatsappWindow.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const count = await service.pruneExpired(now);

      expect(prisma.whatsappWindow.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: cutoff } },
      });
      expect(count).toBe(3);
    });

    it('returns 0 when no windows are pruned', async () => {
      (prisma.whatsappWindow.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const count = await service.pruneExpired();

      expect(count).toBe(0);
    });
  });
});
