import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEnquiryDto, UpdateEnquiryDto, CreateFollowUpDto } from './dto/enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnquiryDto, centerId?: string) {
    return this.prisma.enquiry.create({
      data: { ...dto, centerId: centerId ?? null },
    });
  }

  async findAll(centerId?: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (centerId) where.centerId = centerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        include: { followUps: { orderBy: { doneAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enquiry.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: { followUps: { orderBy: { doneAt: 'desc' } } },
    });
    if (!enquiry) throw new NotFoundException(`Enquiry ${id} not found`);
    return enquiry;
  }

  async update(id: string, dto: UpdateEnquiryDto) {
    await this.findOne(id);
    return this.prisma.enquiry.update({ where: { id }, data: dto });
  }

  async markConverted(id: string) {
    await this.findOne(id);
    return this.prisma.enquiry.update({ where: { id }, data: { isConverted: true } });
  }

  async addFollowUp(enquiryId: string, dto: CreateFollowUpDto, doneBy?: string, centerId?: string) {
    await this.findOne(enquiryId);
    return this.prisma.followUp.create({
      data: {
        enquiryId,
        notes: dto.notes,
        doneBy: doneBy ?? null,
        nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
        centerId: centerId ?? null,
      },
    });
  }

  async getFollowUps(enquiryId: string) {
    await this.findOne(enquiryId);
    return this.prisma.followUp.findMany({
      where: { enquiryId },
      orderBy: { doneAt: 'desc' },
    });
  }
}
