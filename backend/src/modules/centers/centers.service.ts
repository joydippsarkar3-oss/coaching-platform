import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCenterDto, UpdateCenterDto } from './dto/center.dto';

@Injectable()
export class CentersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCenterDto) {
    const exists = await this.prisma.center.findFirst({
      where: { OR: [{ code: dto.code }, { email: dto.email }] },
    });
    if (exists) {
      throw new ConflictException('Center with this code or email already exists');
    }
    return this.prisma.center.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.center.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.center.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const center = await this.prisma.center.findUnique({
      where: { id },
      include: { territory: true, agreements: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!center) throw new NotFoundException(`Center ${id} not found`);
    return center;
  }

  async update(id: string, dto: UpdateCenterDto) {
    await this.findOne(id);
    return this.prisma.center.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.center.delete({ where: { id } });
  }
}
