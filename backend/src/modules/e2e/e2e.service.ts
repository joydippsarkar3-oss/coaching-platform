import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SeedDto, TeardownDto } from './dto/e2e.dto';

/**
 * Test-fixture provisioning for the Playwright suite (flows F1–F6).
 *
 * Every method refuses to run unless E2E_FIXTURES_ENABLED=true AND NODE_ENV is
 * not production — the endpoints create logins and wipe rows, so they must never
 * be reachable on a real deployment even if the module is accidentally imported.
 */
@Injectable()
export class E2eService {
  private readonly logger = new Logger(E2eService.name);

  constructor(private readonly prisma: PrismaService) {}

  static isEnabled(): boolean {
    return (
      process.env.E2E_FIXTURES_ENABLED === 'true' &&
      process.env.NODE_ENV !== 'production'
    );
  }

  private assertEnabled(): void {
    if (!E2eService.isEnabled()) {
      throw new ForbiddenException('E2E fixture endpoints are disabled');
    }
  }

  /**
   * Idempotently provisions a center, one student, one teacher and a published
   * course + batch. Re-running returns the same IDs so the suite can call it
   * before every run without accumulating rows.
   */
  async seed(dto: SeedDto) {
    this.assertEnabled();

    const center = await this.prisma.center.upsert({
      where: { code: dto.centerCode },
      update: { status: 'ACTIVE' },
      create: {
        code: dto.centerCode,
        name: `E2E Center ${dto.centerCode}`,
        ownerName: 'E2E Owner',
        email: `owner+${dto.centerCode.toLowerCase()}@e2e.invalid`,
        phone: dto.adminPhone ?? '+919000000003',
        address: '1 Test Street',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        status: 'ACTIVE',
        plan: { auto_issue: true },
      },
    });

    const teacher = await this.upsertUser(
      dto.teacherPhone,
      'E2E Teacher',
      center.id,
      'TEACHER',
    );
    const admin = await this.upsertUser(
      dto.adminPhone ?? '+919000000003',
      'E2E Center Admin',
      center.id,
      'CENTER_OWNER',
    );
    // The student needs a User row to hold the OTP login and a Student row for
    // enrollment/exam data; the two are keyed by the same phone.
    const studentUser = await this.upsertUser(
      dto.studentPhone,
      'E2E Student',
      center.id,
      'STUDENT',
    );

    let student = await this.prisma.student.findFirst({
      where: { phone: dto.studentPhone, centerId: center.id },
    });
    if (!student) {
      student = await this.prisma.student.create({
        data: {
          centerId: center.id,
          name: 'E2E Student',
          phone: dto.studentPhone,
          email: `student+${dto.centerCode.toLowerCase()}@e2e.invalid`,
          dob: new Date('2000-01-01'),
          gender: 'other',
        },
      });
    }

    const course = await this.prisma.course.upsert({
      where: { code: `E2E-${dto.centerCode}` },
      update: { status: 'PUBLISHED' },
      create: {
        code: `E2E-${dto.centerCode}`,
        centerId: center.id,
        name: 'E2E Test Course',
        durationDays: 90,
        feePaise: 1_000_000,
        status: 'PUBLISHED',
      },
    });

    let batch = await this.prisma.batch.findFirst({
      where: { courseId: course.id, centerId: center.id },
    });
    if (!batch) {
      const start = new Date();
      const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1_000);
      batch = await this.prisma.batch.create({
        data: {
          centerId: center.id,
          courseId: course.id,
          name: 'E2E Batch',
          startDate: start,
          endDate: end,
          capacity: 30,
          teacherId: teacher.id,
          status: 'ONGOING',
          timings: '10:00-12:00',
        },
      });
    }

    this.logger.log(`E2E fixtures seeded for center ${center.code}`);

    return {
      centerId: center.id,
      centerCode: center.code,
      studentId: student.id,
      studentUserId: studentUser.id,
      teacherId: teacher.id,
      adminId: admin.id,
      courseId: course.id,
      batchId: batch.id,
    };
  }

  /**
   * Removes everything seed() created for a center, children first so foreign
   * keys stay satisfied. Safe to call when nothing was seeded.
   */
  async teardown(dto: TeardownDto) {
    this.assertEnabled();

    const center = await this.prisma.center.findUnique({
      where: { code: dto.centerCode },
    });
    if (!center) return { deleted: false };

    const centerId = center.id;
    const attempts = await this.prisma.examAttempt.findMany({
      where: { centerId },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);

    if (attemptIds.length > 0) {
      await this.prisma.examAnswer.deleteMany({
        where: { attemptId: { in: attemptIds } },
      });
      await this.prisma.examAttempt.deleteMany({ where: { centerId } });
    }

    await this.prisma.certificate.deleteMany({ where: { centerId } });
    await this.prisma.payment.deleteMany({ where: { centerId } });
    await this.prisma.installment.deleteMany({ where: { centerId } });
    await this.prisma.enrollment.deleteMany({ where: { centerId } });
    await this.prisma.batch.deleteMany({ where: { centerId } });
    await this.prisma.student.deleteMany({ where: { centerId } });
    await this.prisma.roleAssignment.deleteMany({ where: { centerId } });
    await this.prisma.course.deleteMany({ where: { centerId } });
    await this.prisma.center.delete({ where: { id: centerId } });

    this.logger.log(`E2E fixtures torn down for center ${dto.centerCode}`);
    return { deleted: true };
  }

  /**
   * Returns the current unexpired OTP for a phone so the suite can complete a
   * login without an SMS gateway.
   */
  async peekOtp(phone: string) {
    this.assertEnabled();

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) return { code: null };

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    });
    return { code: otp?.code ?? null };
  }

  private async upsertUser(
    phone: string,
    name: string,
    centerId: string,
    role: 'TEACHER' | 'CENTER_OWNER' | 'STUDENT',
  ) {
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: { centerId, isActive: true },
      create: { phone, name, centerId, isActive: true },
    });

    const existing = await this.prisma.roleAssignment.findFirst({
      where: { userId: user.id, centerId, role },
    });
    if (!existing) {
      await this.prisma.roleAssignment.create({
        data: { userId: user.id, centerId, role },
      });
    }
    return user;
  }
}
