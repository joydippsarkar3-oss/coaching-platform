import { NotFoundException } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { createPrismaMock } from '../../test/prisma.mock';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let pdfQueue: { add: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    pdfQueue = { add: jest.fn() };
    service = new CertificatesService(prisma as any, pdfQueue as any);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // verifyByCertNo
  // ─────────────────────────────────────────────────────────────────────────

  describe('verifyByCertNo', () => {
    it('returns {found:false} for an unknown cert_no', async () => {
      prisma.certificate.findUnique.mockResolvedValue(null);

      const result = await service.verifyByCertNo('BRND-CERT-9999-000000');

      expect(result.found).toBe(false);
      expect(result.status).toBe('NOT_FOUND');
      expect(result.studentName).toBeNull();
    });

    it('does NOT write a verificationLog entry when cert is not found', async () => {
      prisma.certificate.findUnique.mockResolvedValue(null);

      await service.verifyByCertNo('BRND-CERT-9999-000000');

      expect(prisma.verificationLog.create).not.toHaveBeenCalled();
    });

    it('returns full details for a valid issued certificate', async () => {
      const issuedAt = new Date('2026-01-15T00:00:00Z');
      prisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        certificateNo: 'BRND-CERT-2026-000001',
        status: 'ISSUED',
        issuedAt,
        centerId: 'center-1',
        grade: 'A',
        student: { name: 'Alice' },
        course: { name: 'Full Stack Dev' },
        center: { name: 'Delhi Center' },
      } as any);
      prisma.verificationLog.create.mockResolvedValue({} as any);

      const result = await service.verifyByCertNo('BRND-CERT-2026-000001', '1.2.3.4');

      expect(result.found).toBe(true);
      expect(result.status).toBe('ISSUED');
      expect(result.studentName).toBe('Alice');
      expect(result.courseName).toBe('Full Stack Dev');
      expect(result.centerName).toBe('Delhi Center');
      expect(result.grade).toBe('A');
      expect(result.issueDate).toEqual(issuedAt);
      expect(result.isRevoked).toBe(false);
    });

    it('returns {found:true, isRevoked:true} for a revoked certificate', async () => {
      prisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-2',
        certificateNo: 'BRND-CERT-2026-000002',
        status: 'REVOKED',
        issuedAt: new Date(),
        centerId: 'center-1',
        grade: null,
        student: { name: 'Bob' },
        course: { name: 'Python Basics' },
        center: { name: 'Mumbai Center' },
      } as any);
      prisma.verificationLog.create.mockResolvedValue({} as any);

      const result = await service.verifyByCertNo('BRND-CERT-2026-000002');

      expect(result.found).toBe(true);
      expect(result.isRevoked).toBe(true);
      expect(result.status).toBe('REVOKED');
    });

    it('always writes to verificationLog when cert is found', async () => {
      prisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-3',
        certificateNo: 'BRND-CERT-2026-000003',
        status: 'ISSUED',
        issuedAt: new Date(),
        centerId: 'center-1',
        grade: null,
        student: { name: 'Carol' },
        course: { name: 'Java EE' },
        center: null,
      } as any);
      prisma.verificationLog.create.mockResolvedValue({} as any);

      await service.verifyByCertNo('BRND-CERT-2026-000003', '5.6.7.8');

      expect(prisma.verificationLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.verificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            certificateId: 'cert-3',
            ipAddress: '5.6.7.8',
          }),
        }),
      );
    });

    it('writes verificationLog even for a revoked certificate', async () => {
      prisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-4',
        certificateNo: 'BRND-CERT-2026-000004',
        status: 'REVOKED',
        issuedAt: new Date(),
        centerId: 'center-1',
        grade: null,
        student: { name: 'Dave' },
        course: { name: 'DevOps' },
        center: { name: 'Chennai Center' },
      } as any);
      prisma.verificationLog.create.mockResolvedValue({} as any);

      await service.verifyByCertNo('BRND-CERT-2026-000004');

      expect(prisma.verificationLog.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // revoke
  // ─────────────────────────────────────────────────────────────────────────

  describe('revoke', () => {
    it('updates status to REVOKED with reason, revokedAt, and revokedBy', async () => {
      const existingCert = { id: 'cert-10', status: 'ISSUED' };
      prisma.certificate.findUnique.mockResolvedValue(existingCert as any);
      prisma.certificate.update.mockResolvedValue({
        ...existingCert,
        status: 'REVOKED',
        revokeReason: 'Fraud detected',
        revokedBy: 'staff-99',
        revokedAt: expect.any(Date),
      } as any);

      await service.revoke('cert-10', 'Fraud detected', 'staff-99');

      expect(prisma.certificate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cert-10' },
          data: expect.objectContaining({
            status: 'REVOKED',
            revokeReason: 'Fraud detected',
            revokedBy: 'staff-99',
          }),
        }),
      );
    });

    it('sets revokedAt to a Date value', async () => {
      prisma.certificate.findUnique.mockResolvedValue({ id: 'cert-11', status: 'ISSUED' } as any);
      prisma.certificate.update.mockResolvedValue({} as any);

      await service.revoke('cert-11', 'Error in grades', 'staff-42');

      const updateCall = prisma.certificate.update.mock.calls[0][0];
      expect(updateCall.data.revokedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException for an unknown certId', async () => {
      prisma.certificate.findUnique.mockResolvedValue(null);

      await expect(service.revoke('nonexistent', 'any reason', 'staff-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.certificate.update).not.toHaveBeenCalled();
    });
  });
});
