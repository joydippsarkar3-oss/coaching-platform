import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantContext } from '../../common/middleware/tenant.storage';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { UpdateContentItemDto } from './dto/update-content-item.dto';

@Injectable()
export class ContentItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  async findAll(courseId?: string) {
    const centerId = this.tenant.centerId;
    return this.prisma.contentItem.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        ...(courseId ? { courseId } : {}),
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content item not found');
    this.assertAccess(item.centerId);
    return item;
  }

  async create(dto: CreateContentItemDto) {
    const centerId = this.tenant.centerId;
    return this.prisma.contentItem.create({
      data: { ...dto, centerId: centerId ?? dto.centerId },
    });
  }

  async update(id: string, dto: UpdateContentItemDto) {
    await this.findOne(id); // access check
    return this.prisma.contentItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contentItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private assertAccess(itemCenterId: string | null) {
    const centerId = this.tenant.centerId;
    if (centerId && itemCenterId && centerId !== itemCenterId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
