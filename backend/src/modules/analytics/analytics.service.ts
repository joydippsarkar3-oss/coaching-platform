import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EnrollmentStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(centerId: string | null, from: Date, to: Date) {
    const centerFilter = centerId ? { centerId } : {};
    const dateFilter = { createdAt: { gte: from, lte: to } };

    const [
      enquiries,
      leads,
      enrollments,
      activeStudents,
      completions,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.enquiry.count({
        where: { ...centerFilter, ...dateFilter },
      }),
      this.prisma.enquiry.count({
        where: { ...centerFilter, ...dateFilter, isConverted: false },
      }),
      this.prisma.enrollment.count({
        where: { ...centerFilter, ...dateFilter },
      }),
      this.prisma.enrollment.count({
        where: {
          ...centerFilter,
          status: EnrollmentStatus.ACTIVE,
        },
      }),
      this.prisma.enrollment.count({
        where: {
          ...centerFilter,
          status: EnrollmentStatus.COMPLETED,
          completedAt: { gte: from, lte: to },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...centerFilter,
          status: PaymentStatus.SUCCESS,
          paidAt: { gte: from, lte: to },
        },
        _sum: { amountPaise: true },
      }),
    ]);

    return {
      enquiries,
      leads,
      enrollments,
      activeStudents,
      completions,
      totalRevenuePaise: revenueAgg._sum.amountPaise ?? 0,
    };
  }

  async getCoursePerformance(centerId: string | null, from: Date, to: Date) {
    const centerFilter = centerId ? { centerId } : {};

    const enrollmentGroups = await this.prisma.enrollment.groupBy({
      by: ['courseId'],
      where: {
        ...centerFilter,
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
    });

    const courseIds = enrollmentGroups.map((g) => g.courseId);

    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, name: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c.name]));

    const results = await Promise.all(
      enrollmentGroups.map(async (group) => {
        const cid = group.courseId;

        const attempts = await this.prisma.examAttempt.findMany({
          where: {
            ...(centerId ? { centerId } : {}),
            exam: { courseId: cid },
            status: { in: ['PASSED', 'FAILED'] as any },
            submittedAt: { gte: from, lte: to },
          },
          select: { passed: true, score: true },
        });

        const totalAttempts = attempts.length;
        const passed = attempts.filter((a) => a.passed === true).length;
        const passRate = totalAttempts > 0 ? passed / totalAttempts : 0;
        const scores = attempts.map((a) => a.score ?? 0);
        const avgScore =
          scores.length > 0
            ? scores.reduce((s, v) => s + v, 0) / scores.length
            : 0;

        const typingAttempts = await this.prisma.typingAttempt.findMany({
          where: {
            ...(centerId ? { centerId } : {}),
            status: 'completed',
            completedAt: { gte: from, lte: to },
          },
          select: { netWpm: true },
        });
        const wpms = typingAttempts.map((t) => t.netWpm ?? 0);
        const avgNetWpm =
          wpms.length > 0 ? wpms.reduce((s, v) => s + v, 0) / wpms.length : 0;

        return {
          courseId: cid,
          courseName: courseMap.get(cid) ?? cid,
          enrollments: group._count.id,
          passRate,
          avgScore,
          avgNetWpm,
        };
      }),
    );

    return results;
  }

  async getCenterLeaderboard(from: Date, to: Date) {
    const revenueGroups = await this.prisma.payment.groupBy({
      by: ['centerId'],
      where: {
        status: PaymentStatus.SUCCESS,
        paidAt: { gte: from, lte: to },
        centerId: { not: null },
      },
      _sum: { amountPaise: true },
      orderBy: { _sum: { amountPaise: 'desc' } },
      take: 20,
    });

    const centerIds = revenueGroups
      .map((g) => g.centerId)
      .filter((id): id is string => id !== null);

    const [centers, enrollmentGroups] = await Promise.all([
      this.prisma.center.findMany({
        where: { id: { in: centerIds } },
        select: { id: true, name: true, city: true },
      }),
      this.prisma.enrollment.groupBy({
        by: ['centerId'],
        where: {
          centerId: { in: centerIds },
          createdAt: { gte: from, lte: to },
        },
        _count: { id: true },
      }),
    ]);

    const centerMap = new Map(
      centers.map((c) => [c.id, { name: c.name, city: c.city }]),
    );
    const enrollMap = new Map(
      enrollmentGroups.map((g) => [g.centerId, g._count.id]),
    );

    return revenueGroups.map((g) => {
      const info = centerMap.get(g.centerId!) ?? {
        name: g.centerId!,
        city: '',
      };
      const revenuePaise = g._sum.amountPaise ?? 0;
      const enrollments = enrollMap.get(g.centerId!) ?? 0;
      // Simple health score: normalised 0-100 based on revenue rank
      const healthScore = Math.min(
        100,
        Math.round((revenuePaise / 1_000_000) * 10),
      );
      return {
        centerId: g.centerId!,
        centerName: info.name,
        city: info.city,
        revenuePaise,
        enrollments,
        healthScore,
      };
    });
  }

  async getRevenueByMonth(centerId: string | null, year: number) {
    const centerFilter = centerId ? { centerId } : {};
    const from = new Date(`${year}-01-01T00:00:00.000Z`);
    const to = new Date(`${year}-12-31T23:59:59.999Z`);

    const payments = await this.prisma.payment.findMany({
      where: {
        ...centerFilter,
        status: PaymentStatus.SUCCESS,
        paidAt: { gte: from, lte: to },
      },
      select: { paidAt: true, amountPaise: true },
    });

    const monthlyMap = new Map<number, number>();
    for (let m = 1; m <= 12; m++) monthlyMap.set(m, 0);

    for (const p of payments) {
      if (!p.paidAt) continue;
      const month = p.paidAt.getMonth() + 1;
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + p.amountPaise);
    }

    return Array.from(monthlyMap.entries()).map(([month, revenuePaise]) => ({
      month,
      revenuePaise,
    }));
  }
}
