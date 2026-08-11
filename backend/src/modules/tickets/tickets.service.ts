import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantContext } from '../../common/context/tenant.context';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  async findAll(status?: string) {
    const centerId = this.tenant.centerId;
    return this.prisma.ticket.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertAccess(ticket.centerId);
    return ticket;
  }

  async create(dto: CreateTicketDto) {
    const centerId = this.tenant.centerId;
    return this.prisma.ticket.create({
      data: { ...dto, centerId: centerId ?? dto.centerId },
      include: { messages: true },
    });
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED' && !data.resolvedAt) {
      data.resolvedAt = new Date();
    }
    return this.prisma.ticket.update({ where: { id }, data });
  }

  async addMessage(ticketId: string, dto: AddTicketMessageDto) {
    await this.findOne(ticketId); // access check
    return this.prisma.ticketMessage.create({
      data: { ticketId, ...dto },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private assertAccess(itemCenterId: string | null) {
    const centerId = this.tenant.centerId;
    if (centerId && itemCenterId && centerId !== itemCenterId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
