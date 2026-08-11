import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CrmService } from './crm.service';

class UpdateLeadDto {
  status: string;
  notes?: string;
}

@ApiTags('crm')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(Role.SUPER_ADMIN)
@Controller('crm')
export class CrmController {
  constructor(private readonly svc: CrmService) {}

  @Get('leads')
  @ApiOperation({ summary: 'List CRM leads (enquiries) with optional filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  getLeads(
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.svc.getLeads({ status, city, assignedTo });
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update lead status and/or notes with audit trail' })
  updateLead(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.svc.updateLeadStatus(id, dto.status, dto.notes);
  }

  @Get('territory')
  @ApiOperation({ summary: 'Check territory availability for a city/state' })
  @ApiQuery({ name: 'city', required: true })
  @ApiQuery({ name: 'state', required: true })
  checkTerritory(
    @Query('city') city: string,
    @Query('state') state: string,
  ) {
    return this.svc.checkTerritory(city, state);
  }
}
