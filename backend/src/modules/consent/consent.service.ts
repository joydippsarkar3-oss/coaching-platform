import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export enum ConsentPurpose {
  ENROLLMENT = 'enrollment',
  COMMS_MARKETING = 'comms_marketing',
  PHOTO_USE = 'photo_use',
  DATA_ANALYTICS = 'data_analytics',
  THIRD_PARTY_SHARE = 'third_party_share',
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an append-only consent entry — never updates, only inserts.
   */
  async recordConsent(params: {
    subjectUserId: string;
    guardianUserId?: string;
    purpose: ConsentPurpose;
    noticeVersion: string;
    method: 'otp_verified' | 'assisted_otp' | 'written';
    centerId?: string;
  }): Promise<any> {
    const consent = await this.prisma.consent.create({
      data: {
        subjectUserId: params.subjectUserId,
        guardianUserId: params.guardianUserId ?? null,
        purpose: params.purpose,
        noticeVersion: params.noticeVersion,
        method: params.method,
        centerId: params.centerId ?? null,
        grantedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: params.subjectUserId,
        centerId: params.centerId ?? null,
        action: 'CONSENT_RECORDED',
        entity: 'Consent',
        entityId: consent.id,
        newValue: {
          purpose: params.purpose,
          method: params.method,
          noticeVersion: params.noticeVersion,
          guardianUserId: params.guardianUserId ?? null,
        },
      },
    });

    return consent;
  }

  /**
   * Sets withdrawn_at — does NOT delete the record (append-only audit trail).
   */
  async withdrawConsent(consentId: string, withdrawnBy: string): Promise<void> {
    const consent = await this.prisma.consent.findUnique({ where: { id: consentId } });
    if (!consent) throw new NotFoundException(`Consent ${consentId} not found`);
    if (consent.withdrawnAt) throw new BadRequestException('Consent already withdrawn');

    await this.prisma.consent.update({
      where: { id: consentId },
      data: { withdrawnAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: withdrawnBy,
        action: 'CONSENT_WITHDRAWN',
        entity: 'Consent',
        entityId: consentId,
        newValue: { withdrawnBy, withdrawnAt: new Date().toISOString() },
      },
    });
  }

  /**
   * Returns true only if a valid non-withdrawn consent exists for this purpose+user.
   */
  async checkConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    const consent = await this.prisma.consent.findFirst({
      where: {
        subjectUserId: userId,
        purpose,
        withdrawnAt: null,
      },
    });
    return consent !== null;
  }

  /**
   * Checks COMMS_MARKETING consent and confirms the user is not a minor.
   * Minors (under 18) are always blocked from marketing regardless of consent.
   */
  async isMarketingAllowed(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true },
    });

    if (!user) return false;

    if (user.dateOfBirth) {
      const ageMs = Date.now() - user.dateOfBirth.getTime();
      const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1_000);
      if (ageYears < 18) return false;
    }

    return this.checkConsent(userId, ConsentPurpose.COMMS_MARKETING);
  }

  /**
   * Sends a WhatsApp/SMS OTP link to the guardian and creates a pending
   * consent_request record.
   */
  async initiateGuardianConsent(params: {
    studentUserId: string;
    guardianPhone: string;
    purpose: ConsentPurpose;
    noticeVersion: string;
  }): Promise<{ consentRequestId: string; otpSent: boolean }> {
    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1_000); // 30 minutes

    const request = await this.prisma.consentRequest.create({
      data: {
        studentUserId: params.studentUserId,
        guardianPhone: params.guardianPhone,
        purpose: params.purpose,
        noticeVersion: params.noticeVersion,
        otp,
        otpExpiresAt,
        status: 'PENDING',
      },
    });

    // TODO: send OTP via WhatsApp/SMS — stub for now
    this.logger.log(
      `[OTP STUB] Guardian consent OTP for request ${request.id}: ` +
        `phone=${params.guardianPhone} otp=${otp}`,
    );

    return { consentRequestId: request.id, otpSent: true };
  }

  /**
   * Validates the OTP and records consent with method='otp_verified'.
   */
  async verifyGuardianConsent(consentRequestId: string, otp: string): Promise<any> {
    const request = await this.prisma.consentRequest.findUnique({
      where: { id: consentRequestId },
    });

    if (!request) throw new NotFoundException(`Consent request ${consentRequestId} not found`);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Consent request is no longer pending');
    }
    if (new Date() > request.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }
    if (request.otp !== otp) {
      throw new ForbiddenException('Invalid OTP');
    }

    // Mark request as verified
    await this.prisma.consentRequest.update({
      where: { id: consentRequestId },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    });

    // Find guardian user by phone (optional — guardian may not have an account)
    const guardianUser = await this.prisma.user.findFirst({
      where: { phone: request.guardianPhone },
      select: { id: true },
    });

    return this.recordConsent({
      subjectUserId: request.studentUserId,
      guardianUserId: guardianUser?.id,
      purpose: request.purpose as ConsentPurpose,
      noticeVersion: request.noticeVersion,
      method: 'otp_verified',
    });
  }

  /**
   * DSAR: returns all personal data for the user.
   * Excludes financial records older than 7 years (retention carve-out).
   */
  async exportUserData(userId: string): Promise<object> {
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    const [user, enrollments, payments, consents, examAttempts] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          roleAssignments: { select: { role: true, centerId: true } },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { studentId: userId },
        include: {
          course: { select: { name: true } },
          center: { select: { name: true, code: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          installment: { enrollment: { studentId: userId } },
          paidAt: { gte: sevenYearsAgo }, // retention carve-out
        },
        select: {
          id: true,
          amountPaise: true,
          method: true,
          status: true,
          paidAt: true,
          gatewayRef: true,
        },
      }),
      this.prisma.consent.findMany({
        where: { subjectUserId: userId },
        select: {
          id: true,
          purpose: true,
          noticeVersion: true,
          method: true,
          grantedAt: true,
          withdrawnAt: true,
        },
      }),
      this.prisma.examAttempt.findMany({
        where: { studentId: userId },
        select: {
          id: true,
          examId: true,
          score: true,
          passed: true,
          submittedAt: true,
        },
      }),
    ]);

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    return {
      exportedAt: new Date().toISOString(),
      profile: user,
      enrollments,
      payments,
      consents,
      examAttempts,
    };
  }

  /**
   * Creates an erasure_request record (not immediate — reviewed by HO).
   * Financial and certificate records are exempt (7-year retention law).
   */
  async requestErasure(
    userId: string,
    requestedBy: string,
  ): Promise<{ erasureId: string }> {
    const erasureRequest = await this.prisma.erasureRequest.create({
      data: {
        userId,
        requestedBy,
        status: 'PENDING',
        requestedAt: new Date(),
        notes:
          'Financial records (payments, ledger) and certificates are exempt ' +
          'from erasure per 7-year statutory retention requirement.',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ERASURE_REQUESTED',
        entity: 'User',
        entityId: userId,
        newValue: {
          erasureId: erasureRequest.id,
          requestedBy,
          requestedAt: new Date().toISOString(),
          status: 'PENDING',
        },
      },
    });

    this.logger.log(
      `Erasure request ${erasureRequest.id} created for userId=${userId} by ${requestedBy}`,
    );

    return { erasureId: erasureRequest.id };
  }
}
