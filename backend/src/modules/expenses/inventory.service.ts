import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantContext } from '../../common/context/tenant.context';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  async findAll() {
    const centerId = this.tenant.centerId;
    return this.prisma.inventoryItem.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    this.assertAccess(item.centerId);
    return item;
  }

  async create(dto: CreateInventoryItemDto) {
    const centerId = this.tenant.centerId;
    return this.prisma.inventoryItem.create({
      data: { ...dto, centerId: centerId ?? dto.centerId },
    });
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    await this.findOne(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Adjust stock up (+) or down (-). Throws if it would go negative. */
  async adjustStock(id: string, dto: AdjustStockDto) {
    const item = await this.findOne(id);
    const next = item.quantityOnHand + dto.delta;
    if (next < 0) {
      throw new Error(
        `Insufficient stock: current=${item.quantityOnHand}, delta=${dto.delta}`,
      );
    }
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { quantityOnHand: next },
    });
  }

  private assertAccess(itemCenterId: string | null) {
    const centerId = this.tenant.centerId;
    if (centerId && itemCenterId && centerId !== itemCenterId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
