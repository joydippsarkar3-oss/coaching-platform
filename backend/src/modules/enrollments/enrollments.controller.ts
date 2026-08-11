import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';

@ApiTags('enrollments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Enroll a student in a course, optionally assigning to a batch and fee plan' })
  create(@Body() dto: CreateEnrollmentDto, @TenantId() centerId: string | null) {
    return this.enrollmentsService.create(dto, centerId ?? undefined);
  }

  @Get()
  @ApiOperation({ summary: 'List enrollments with optional filters' })
  @ApiQuery({ name: 'centerId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('centerId') centerId?: string,
    @Query('studentId') studentId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.enrollmentsService.findAll(centerId, studentId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment details including installments and payments' })
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Put(':id/drop')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER)
  @ApiOperation({ summary: 'Drop (deactivate) an enrollment' })
  drop(@Param('id') id: string) {
    return this.enrollmentsService.drop(id);
  }

  @Put(':id/complete')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Mark an enrollment as completed' })
  complete(@Param('id') id: string) {
    return this.enrollmentsService.complete(id);
  }
}
