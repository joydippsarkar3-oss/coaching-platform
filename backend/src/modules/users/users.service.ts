import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('User with this phone already exists');

    const { roles, ...userData } = dto;
    const user = await this.prisma.user.create({ data: userData });

    if (roles?.length) {
      await this.prisma.roleAssignment.createMany({
        data: roles.map((role) => ({
          userId: user.id,
          centerId: dto.centerId ?? null,
          role,
        })),
      });
    }

    return this.findOne(user.id);
  }

  async findAll(centerId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = centerId ? { centerId } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { roleAssignments: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roleAssignments: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const { passwordHash, totpSecret, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { roles, ...userData } = dto;
    return this.prisma.user.update({ where: { id }, data: userData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async assignRole(id: string, dto: AssignRoleDto) {
    await this.findOne(id);
    return this.prisma.roleAssignment.upsert({
      where: {
        userId_centerId_role: {
          userId: id,
          centerId: dto.centerId ?? null,
          role: dto.role,
        },
      },
      update: {},
      create: { userId: id, centerId: dto.centerId ?? null, role: dto.role },
    });
  }

  async setPassword(id: string, plainPassword: string) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}
