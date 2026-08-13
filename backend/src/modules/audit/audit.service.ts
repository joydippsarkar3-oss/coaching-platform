import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface WriteAuditLogInput {
  centerId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: WriteAuditLogInput) {
    const { oldValue, newValue, ...rest } = input;
    return this.prisma.auditLog.create({
      data: {
        ...rest,
        // Prisma requires omission (or JsonNull) rather than `null` for optional Json
        ...(oldValue ? { oldValue: oldValue as Prisma.InputJsonValue } : {}),
        ...(newValue ? { newValue: newValue as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async findAll(centerId?: string, entity?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (centerId) where.centerId = centerId;
    if (entity) where.entity = entity;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, phone: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
