import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';

// p95 target <1.5s on verifyByCertNo — use DB index on cert_no, no joins beyond necessary

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pdf-generation') private readonly pdfQueue: Queue,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Certificate numbering
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns the next certificate number for the given year using a Postgres
   * per-year sequence. Creates the sequence if it does not exist. Wraps the
   * sequence fetch and sequence creation in a transaction with an advisory lock
   * so concurrent calls for the same year never produce duplicates.
   *
   * @param year - 4-digit year, e.g. 2026
   * @returns formatted cert number e.g. "BRND-CERT-2026-000001"
   */
  async getNextCertNo(year: number): Promise<string> {
    // Advisory lock key: deterministic integer derived from year
    const lockKey = 1_000_000 + year; // e.g. 1002026 — stays well within int4 range

    const result = await this.prisma.$transaction(async (tx) => {
      // Acquire session-level advisory lock (released when transaction ends)
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);

      // Create sequence for this year if missing
      await tx.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS cert_seq_${year} START 1 INCREMENT 1`,
      );

      // Atomically advance and read the sequence
      const rows = await tx.$queryRawUnsafe<Array<{ nextval: bigint }>>(
        `SELECT nextval('cert_seq_${year}') AS nextval`,
      );
      return rows[0].nextval;
    });

    const seq = Number(result);
    const padded = String(seq).padStart(6, '0');
    return `BRND-CERT-${year}-${padded}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Issuance
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validates eligibility (course COMPLETED + exam passed + fees cleared) then
   * creates a certificate record with status PENDING.
   *
   * @param enrollmentId - UUID of the enrollment
   * @param requestedBy - userId of the requesting staff member
   * @returns newly created certificate record
   * @throws NotFoundException if enrollment not found
   * @throws BadRequestException if any eligibility gate fails
   */
  async requestIssuance(enrollmentId: string, requestedBy: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        course: true,
        installments: { select: { status: true, amountPaise: true } },
      },
    });
    if (!enrollment) throw new NotFoundException(`Enrollment ${enrollmentId} not found`);

    // Gate 1: course completed
    if (enrollment.status !== 'COMPLETED') {
      throw new BadRequestException('Course has not been completed');
    }

    // Gate 2: exam passed — find the latest EVALUATED attempt for this course
    const examAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        studentId: enrollment.studentId,
        exam: { courseId: enrollment.courseId },
        status: 'EVALUATED',
        passed: true,
      },
    });
    if (!examAttempt) {
      throw new BadRequestException('Student has not passed the required exam');
    }

    // Gate 3: fees cleared — no PENDING or OVERDUE installments
    const unpaid = enrollment.installments.filter((i) =>
      ['PENDING', 'OVERDUE'].includes(i.status),
    );
    if (unpaid.length > 0) {
      throw new BadRequestException(`${unpaid.length} installment(s) are still outstanding`);
    }

    // Prevent duplicate PENDING/ISSUED certificates
    const existing = await this.prisma.certificate.findFirst({
      where: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        status: { in: ['REQUESTED', 'ISSUED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('A certificate is already pending or issued for this enrollment');
    }

    return this.prisma.certificate.create({
      data: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        centerId: enrollment.centerId,
        certificateNo: `PENDING-${enrollmentId}`, // placeholder; replaced by issueMany
        status: 'REQUESTED',
        ['requestedBy' as string]: requestedBy,
        ['enrollmentId' as string]: enrollmentId,
      },
      include: { student: true, course: true },
    });
  }

  /**
   * Bulk-issues certificates: assigns cert numbers, sets issue date, triggers PDF
   * generation, and writes a verification log entry for each.
   *
   * @param certIds - array of certificate UUIDs to issue
   * @returns array of updated certificate records
   * @throws NotFoundException if any certId not found
   * @throws BadRequestException if any certificate is not in REQUESTED status
   */
  async issueMany(certIds: string[]) {
    const year = new Date().getFullYear();
    const results = [];

    for (const certId of certIds) {
      const cert = await this.prisma.certificate.findUnique({ where: { id: certId } });
      if (!cert) throw new NotFoundException(`Certificate ${certId} not found`);
      if (cert.status !== 'REQUESTED') {
        throw new BadRequestException(`Certificate ${certId} is not in REQUESTED status`);
      }

      const certNo = await this.getNextCertNo(year);

      const updated = await this.prisma.certificate.update({
        where: { id: certId },
        data: {
          certificateNo: certNo,
          issuedAt: new Date(),
          status: 'ISSUED',
        },
        include: { student: true, course: true },
      });

      // Write verification log entry
      await this.prisma.verificationLog.create({
        data: {
          certificateId: certId,
          centerId: cert.centerId,
          verifiedBy: 'SYSTEM_ISSUE',
        },
      });

      // Trigger PDF generation job
      await this.triggerPdfGeneration(certId, 'CERTIFICATE');

      results.push(updated);
    }

    return results;
  }

  /**
   * If the center's plan has auto_issue=true and eligibility passes, calls
   * issueMany directly without manual intervention.
   *
   * @param certId - UUID of the certificate
   */
  async autoIssueRule(certId: string): Promise<void> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certId },
      include: { center: true },
    });
    if (!cert) throw new NotFoundException(`Certificate ${certId} not found`);

    const centerPlan = (cert.center?.plan ?? {}) as Record<string, unknown>;
    if (!centerPlan['auto_issue']) return;

    await this.issueMany([certId]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Revocation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Revokes a certificate. The verification endpoint reads directly from DB
   * (no cache) so revocation is reflected instantly.
   *
   * @param certId - UUID of the certificate
   * @param reason - textual reason for revocation
   * @param revokedBy - userId of the staff member revoking
   * @returns updated certificate record
   * @throws NotFoundException if certificate not found
   */
  async revoke(certId: string, reason: string, revokedBy: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id: certId } });
    if (!cert) throw new NotFoundException(`Certificate ${certId} not found`);

    return this.prisma.certificate.update({
      where: { id: certId },
      data: {
        status: 'REVOKED',
        ['revokeReason' as string]: reason,
        ['revokedAt' as string]: new Date(),
        ['revokedBy' as string]: revokedBy,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public verify endpoint
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verifies a certificate by its certificate number. Reads directly from DB —
   * no cache — so revocation is always reflected. Writes to verification_logs.
   * Rate limiting is applied at the controller level (@Throttle(10, 60)).
   *
   * @param certNo - formatted certificate number e.g. "BRND-CERT-2026-000001"
   * @param ipAddress - caller's IP address for logging
   * @returns verification result object
   */
  async verifyByCertNo(
    certNo: string,
    ipAddress?: string,
  ): Promise<{
    found: boolean;
    status: string;
    studentName: string | null;
    courseName: string | null;
    centerName: string | null;
    grade: string | null;
    issueDate: Date | null;
    isRevoked: boolean;
  }> {
    // Direct DB read — no cache. Index on certificateNo ensures p95 <1.5s.
    const cert = await this.prisma.certificate.findUnique({
      where: { certificateNo: certNo },
      include: {
        student: { select: { name: true } },
        course: { select: { name: true } },
        center: { select: { name: true } },
      },
    });

    if (!cert) {
      return {
        found: false,
        status: 'NOT_FOUND',
        studentName: null,
        courseName: null,
        centerName: null,
        grade: null,
        issueDate: null,
        isRevoked: false,
      };
    }

    // Log every verification attempt
    await this.prisma.verificationLog.create({
      data: {
        certificateId: cert.id,
        centerId: cert.centerId,
        ipAddress: ipAddress ?? null,
      },
    });

    return {
      found: true,
      status: cert.status,
      studentName: cert.student.name,
      courseName: cert.course.name,
      centerName: cert.center?.name ?? null,
      grade: (cert['grade'] as string | null) ?? null,
      issueDate: cert.issuedAt,
      isRevoked: cert.status === 'REVOKED',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PDF generation job trigger
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Enqueues a BullMQ job on the `pdf-generation` queue with the certificate
   * ID, document type, and template ID. Actual PDF rendering runs in the worker.
   *
   * @param certId - UUID of the certificate (or receipt/ID card/letter record)
   * @param docType - 'CERTIFICATE' | 'RECEIPT' | 'ID_CARD' | 'ADMISSION_LETTER'
   * @returns BullMQ Job object
   */
  async triggerPdfGeneration(
    certId: string,
    docType: 'CERTIFICATE' | 'RECEIPT' | 'ID_CARD' | 'ADMISSION_LETTER',
  ) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certId },
      select: { templateId: true },
    });

    return this.pdfQueue.add('generate', {
      certId,
      docType,
      templateId: cert?.templateId ?? null,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Existing CRUD kept for controller compatibility
  // ─────────────────────────────────────────────────────────────────────────

  async findAll(centerId?: string, studentId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (centerId) where['centerId'] = centerId;
    if (studentId) where['studentId'] = studentId;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        include: { student: true, course: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.certificate.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: { student: true, course: true, template: true },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  /** Legacy alias kept for controller compatibility */
  async verifyByNumber(certificateNo: string, ipAddress?: string) {
    return this.verifyByCertNo(certificateNo, ipAddress);
  }
}
