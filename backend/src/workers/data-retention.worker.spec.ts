import { Test, TestingModule } from '@nestjs/testing';
import { DataRetentionWorker } from './data-retention.worker';
import { PrismaService } from '../common/prisma/prisma.service';

describe('DataRetentionWorker', () => {
  let worker: DataRetentionWorker;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataRetentionWorker,
        {
          provide: PrismaService,
          useValue: {
            otpCode: { deleteMany: jest.fn() },
            notification: { deleteMany: jest.fn() },
            whatsappWindow: { deleteMany: jest.fn() },
            enquiry: { findMany: jest.fn(), deleteMany: jest.fn() },
            followUp: { deleteMany: jest.fn() },
            ticket: { findMany: jest.fn(), deleteMany: jest.fn() },
            ticketMessage: { deleteMany: jest.fn() },
            typingAttempt: { deleteMany: jest.fn() },
            user: { findMany: jest.fn(), deleteMany: jest.fn() },
            roleAssignment: { deleteMany: jest.fn() },
            auditLog: { deleteMany: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    worker = module.get<DataRetentionWorker>(DataRetentionWorker);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should run all purge operations', async () => {
      jest.spyOn(prisma.otpCode, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.notification, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.whatsappWindow, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.enquiry, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.ticket, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.typingAttempt, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'deleteMany').mockResolvedValue({ count: 0 });

      await worker.handle();

      expect(prisma.otpCode.deleteMany).toHaveBeenCalled();
      expect(prisma.notification.deleteMany).toHaveBeenCalled();
      expect(prisma.whatsappWindow.deleteMany).toHaveBeenCalled();
    });
  });

  describe('pruneOtpCodes', () => {
    it('should delete OTP codes older than 24 hours', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const expectedCutoff = new Date('2024-01-14T10:00:00Z');

      jest.spyOn(prisma.otpCode, 'deleteMany').mockResolvedValue({ count: 5 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneOtpCodes(now);

      expect(prisma.otpCode.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expectedCutoff } },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'OTP_PURGE',
          entity: 'DATA_RETENTION',
          oldValue: { rowCount: 5, cutoff: expectedCutoff.toISOString() },
        }),
      });
    });

    it('should not create audit log when no rows deleted', async () => {
      jest.spyOn(prisma.otpCode, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneOtpCodes(new Date());

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('pruneNotifications', () => {
    it('should delete notifications older than 18 months', async () => {
      const now = new Date('2024-07-01T00:00:00Z');
      const expectedCutoff = new Date('2023-01-01T00:00:00Z');

      jest.spyOn(prisma.notification, 'deleteMany').mockResolvedValue({ count: 12 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneNotifications(now);

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expectedCutoff } },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'NOTIFICATION_PURGE',
          oldValue: { rowCount: 12, cutoff: expectedCutoff.toISOString() },
        }),
      });
    });
  });

  describe('pruneStaleEnquiries', () => {
    it('should delete non-converted enquiries older than 24 months', async () => {
      const now = new Date('2024-07-01T00:00:00Z');
      const expectedCutoff = new Date('2022-07-01T00:00:00Z');

      const staleEnquiries = [{ id: 'e1' }, { id: 'e2' }];
      jest.spyOn(prisma.enquiry, 'findMany').mockResolvedValue(staleEnquiries as any);
      jest.spyOn(prisma.followUp, 'deleteMany').mockResolvedValue({ count: 3 });
      jest.spyOn(prisma.enquiry, 'deleteMany').mockResolvedValue({ count: 2 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneStaleEnquiries(now);

      expect(prisma.enquiry.findMany).toHaveBeenCalledWith({
        where: {
          updatedAt: { lt: expectedCutoff },
          isConverted: false,
        },
        select: { id: true },
      });
      expect(prisma.followUp.deleteMany).toHaveBeenCalledWith({
        where: { enquiryId: { in: ['e1', 'e2'] } },
      });
      expect(prisma.enquiry.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['e1', 'e2'] } },
      });
    });
  });

  describe('pruneClosedTickets', () => {
    it('should delete closed tickets older than 3 years', async () => {
      const now = new Date('2024-07-01T00:00:00Z');
      const expectedCutoff = new Date('2021-07-01T00:00:00Z');

      const oldTickets = [{ id: 't1' }, { id: 't2' }];
      jest.spyOn(prisma.ticket, 'findMany').mockResolvedValue(oldTickets as any);
      jest.spyOn(prisma.ticketMessage, 'deleteMany').mockResolvedValue({ count: 8 });
      jest.spyOn(prisma.ticket, 'deleteMany').mockResolvedValue({ count: 2 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneClosedTickets(now);

      expect(prisma.ticket.findMany).toHaveBeenCalledWith({
        where: {
          status: 'CLOSED',
          updatedAt: { lt: expectedCutoff },
        },
        select: { id: true },
      });
      expect(prisma.ticketMessage.deleteMany).toHaveBeenCalledWith({
        where: { ticketId: { in: ['t1', 't2'] } },
      });
    });
  });

  describe('pruneTypingAttempts', () => {
    it('should delete typing attempts older than 2 years', async () => {
      const now = new Date('2024-07-01T00:00:00Z');
      const expectedCutoff = new Date('2022-07-01T00:00:00Z');

      jest.spyOn(prisma.typingAttempt, 'deleteMany').mockResolvedValue({ count: 42 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneTypingAttempts(now);

      expect(prisma.typingAttempt.deleteMany).toHaveBeenCalledWith({
        where: { startedAt: { lt: expectedCutoff } },
      });
    });
  });

  describe('pruneClosedAccounts', () => {
    it('should delete inactive users after 90-day grace period', async () => {
      const now = new Date('2024-07-01T00:00:00Z');
      const expectedCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const closedUsers = [{ id: 'u1' }, { id: 'u2' }];
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(closedUsers as any);
      jest.spyOn(prisma.roleAssignment, 'deleteMany').mockResolvedValue({ count: 3 });
      jest.spyOn(prisma.user, 'deleteMany').mockResolvedValue({ count: 2 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneClosedAccounts(now);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          isActive: false,
          updatedAt: { lt: expectedCutoff },
        },
        select: { id: true },
      });
      expect(prisma.roleAssignment.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: ['u1', 'u2'] } },
      });
    });
  });

  describe('pruneAuditLogs', () => {
    it('should delete audit logs older than 7 years', async () => {
      const now = new Date('2024-07-01T00:00:00Z');
      const expectedCutoff = new Date('2017-07-01T00:00:00Z');

      jest.spyOn(prisma.auditLog, 'deleteMany').mockResolvedValue({ count: 100 });

      await (worker as any).pruneAuditLogs(now);

      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expectedCutoff } },
      });
    });

    it('should not create audit log when purging audit logs', async () => {
      jest.spyOn(prisma.auditLog, 'deleteMany').mockResolvedValue({ count: 10 });
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await (worker as any).pruneAuditLogs(new Date());

      // Should not recurse — no audit log for purging audit logs
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
