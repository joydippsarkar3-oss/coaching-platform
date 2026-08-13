import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto, userRoles: Role[]) {
    const hoRoles: Role[] = [Role.SUPER_ADMIN, Role.HO_STAFF];
    const isHo = userRoles.some((r) => hoRoles.includes(r));
    if (!isHo) throw new ForbiddenException('Only HO staff can create courses');

    const exists = await this.prisma.course.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Course with this code already exists');

    const { syllabus, ...rest } = dto;
    return this.prisma.course.create({
      data: {
        ...rest,
        centerId: null,
        ...(syllabus ? { syllabus: syllabus as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.course.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { contentItems: { orderBy: { order: 'asc' } } },
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, userRoles: Role[]) {
    const hoRoles: Role[] = [Role.SUPER_ADMIN, Role.HO_STAFF];
    if (!userRoles.some((r) => hoRoles.includes(r))) {
      throw new ForbiddenException('Only HO staff can modify courses');
    }
    await this.findOne(id);
    const { syllabus, ...rest } = dto;
    return this.prisma.course.update({
      where: { id },
      data: {
        ...rest,
        ...(syllabus ? { syllabus: syllabus as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({ where: { id } });
  }
}
