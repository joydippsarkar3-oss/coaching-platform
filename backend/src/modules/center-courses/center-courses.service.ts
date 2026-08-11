import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GrantCourseDto, UpdateCenterCourseDto } from './dto/center-course.dto';

@Injectable()
export class CenterCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async grant(centerId: string, dto: GrantCourseDto) {
    const existing = await this.prisma.centerCourse.findUnique({
      where: { centerId_courseId: { centerId, courseId: dto.courseId } },
    });
    if (existing) {
      throw new ConflictException('Course already granted to this center');
    }
    return this.prisma.centerCourse.create({
      data: { centerId, courseId: dto.courseId, customFee: dto.customFee ?? null },
      include: { course: true },
    });
  }

  async findAllForCenter(centerId: string) {
    return this.prisma.centerCourse.findMany({
      where: { centerId },
      include: { course: true },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async findOne(centerId: string, courseId: string) {
    const record = await this.prisma.centerCourse.findUnique({
      where: { centerId_courseId: { centerId, courseId } },
      include: { course: true },
    });
    if (!record) throw new NotFoundException('Center course grant not found');
    return record;
  }

  async update(centerId: string, courseId: string, dto: UpdateCenterCourseDto) {
    await this.findOne(centerId, courseId);
    return this.prisma.centerCourse.update({
      where: { centerId_courseId: { centerId, courseId } },
      data: dto,
    });
  }

  async revoke(centerId: string, courseId: string) {
    await this.findOne(centerId, courseId);
    return this.prisma.centerCourse.delete({
      where: { centerId_courseId: { centerId, courseId } },
    });
  }
}
