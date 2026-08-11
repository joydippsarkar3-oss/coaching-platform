import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, CreateConsentDto } from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const exists = await this.prisma.student.findFirst({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Student with this phone already exists');
    return this.prisma.student.create({ data: dto });
  }

  async findAll(centerId?: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (centerId) where.centerId = centerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.student.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { consents: true, enrollments: { include: { course: true } } },
    });
    if (!student) throw new NotFoundException(`Student ${id} not found`);
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.student.delete({ where: { id } });
  }

  async addConsent(studentId: string, dto: CreateConsentDto, centerId?: string) {
    await this.findOne(studentId);
    return this.prisma.consent.create({ data: { ...dto, studentId, centerId: centerId ?? null } });
  }

  async getConsents(studentId: string) {
    await this.findOne(studentId);
    return this.prisma.consent.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
