import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto, centerId?: string) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    // Verify course exists and is published
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'PUBLISHED') throw new BadRequestException('Course is not published');

    // Prevent duplicate active enrollment
    const existing = await this.prisma.enrollment.findFirst({
      where: { studentId: dto.studentId, courseId: dto.courseId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictException('Student already has an active enrollment in this course');

    // Validate batch if provided
    if (dto.batchId) {
      const batch = await this.prisma.batch.findUnique({ where: { id: dto.batchId } });
      if (!batch) throw new NotFoundException('Batch not found');
      if (batch.courseId !== dto.courseId) throw new BadRequestException('Batch does not belong to this course');
    }

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        courseId: dto.courseId,
        batchId: dto.batchId ?? null,
        centerId: centerId ?? null,
        status: 'ACTIVE',
      },
      include: { student: true, course: true, batch: true },
    });

    // Auto-generate installments from fee plan if provided
    if (dto.feePlanId) {
      const feePlan = await this.prisma.feePlan.findUnique({ where: { id: dto.feePlanId } });
      if (feePlan) {
        const installmentAmount = Math.floor(feePlan.totalAmountPaise / feePlan.installmentCount);
        const today = new Date();
        const installments = Array.from({ length: feePlan.installmentCount }, (_, i) => ({
          enrollmentId: enrollment.id,
          feePlanId: feePlan.id,
          centerId: centerId ?? null,
          amountPaise: i === feePlan.installmentCount - 1
            ? feePlan.totalAmountPaise - installmentAmount * (feePlan.installmentCount - 1)
            : installmentAmount,
          dueDate: new Date(today.getFullYear(), today.getMonth() + i, today.getDate()),
          status: 'PENDING' as const,
        }));
        await this.prisma.installment.createMany({ data: installments });
      }
    }

    return enrollment;
  }

  async findAll(centerId?: string, studentId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (centerId) where.centerId = centerId;
    if (studentId) where.studentId = studentId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: { student: true, course: true, batch: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
        batch: true,
        installments: { include: { payments: true } },
      },
    });
    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    return enrollment;
  }

  async drop(id: string) {
    await this.findOne(id);
    return this.prisma.enrollment.update({ where: { id }, data: { status: 'DROPPED' } });
  }

  async complete(id: string) {
    await this.findOne(id);
    return this.prisma.enrollment.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}
