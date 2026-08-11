import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface LeadFilter {
  status?: string;
  city?: string;
  assignedTo?: string;
}

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeads(filter: LeadFilter) {
    const where: any = {};

    if (filter.assignedTo) {
      where.assignedTo = filter.assignedTo;
    }

    if (filter.city) {
      where.center = { city: { equals: filter.city, mode: 'insensitive' } };
    }

    // Map a loose status string to the isConverted flag or a notes-based status.
    // The Enquiry model uses isConverted: boolean and a free-text notes field.
    // We treat status="converted" as isConverted=true, anything else as isConverted=false.
    if (filter.status !== undefined) {
      if (filter.status === 'converted') {
        where.isConverted = true;
      } else if (filter.status === 'open') {
        where.isConverted = false;
      }
      // other status strings are passed through as a notes search
      else {
        where.notes = { contains: filter.status, mode: 'insensitive' };
      }
    }

    return this.prisma.enquiry.findMany({
      where,
      include: {
        followUps: { orderBy: { doneAt: 'desc' }, take: 1 },
        center: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeadStatus(id: string, status: string, notes?: string) {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) throw new NotFoundException(`Enquiry ${id} not found`);

    const isConverted = status === 'converted';

    // Build a combined notes string that prepends the audit note
    const auditNote = `[${new Date().toISOString()}] Status changed to "${status}"${notes ? ': ' + notes : ''}.`;
    const updatedNotes = enquiry.notes
      ? `${auditNote}\n${enquiry.notes}`
      : auditNote;

    return this.prisma.enquiry.update({
      where: { id },
      data: {
        isConverted,
        notes: updatedNotes,
      },
    });
  }

  async checkTerritory(city: string, state: string) {
    const existingCenters = await this.prisma.center.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        status: true,
        phone: true,
        email: true,
      },
    });

    return {
      available: existingCenters.length === 0,
      existingCenters,
    };
  }
}
