import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantContext } from '../../common/middleware/tenant.storage';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  async findAll(from?: string, to?: string) {
    const centerId = this.tenant.centerId;
    return this.prisma.expense.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        deletedAt: null,
        ...(from || to
          ? {
              expensedAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { expensedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const e = await this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
    });
    if (!e) throw new NotFoundException('Expense not found');
    this.assertAccess(e.centerId);
    return e;
  }

  async create(dto: CreateExpenseDto) {
    const centerId = this.tenant.centerId;
    return this.prisma.expense.create({
      data: { ...dto, centerId: centerId ?? dto.centerId },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async summary(centerId?: string) {
    const cid = centerId ?? this.tenant.centerId;
    const rows = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { ...(cid ? { centerId: cid } : {}), deletedAt: null },
      _sum: { amountPaise: true },
      orderBy: { _sum: { amountPaise: 'desc' } },
    });
    return rows.map((r) => ({
      category: r.category,
      totalPaise: r._sum.amountPaise ?? 0,
    }));
  }

  private assertAccess(itemCenterId: string | null) {
    const centerId = this.tenant.centerId;
    if (centerId && itemCenterId && centerId !== itemCenterId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
