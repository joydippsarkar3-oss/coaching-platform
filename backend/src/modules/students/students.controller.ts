import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, CreateConsentDto } from './dto/student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';

@ApiTags('students')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Register a new student' })
  create(@Body() dto: CreateStudentDto, @TenantId() centerId: string | null) {
    return this.studentsService.create({ ...dto, centerId: dto.centerId ?? centerId ?? undefined });
  }

  @Get()
  @ApiOperation({ summary: 'List students, optionally filtered by center' })
  @ApiQuery({ name: 'centerId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('centerId') centerId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(centerId, +page, +limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID (includes consents and enrollments)' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Update student profile' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student record (SUPER_ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Post(':id/consents')
  @ApiOperation({ summary: 'Record a consent decision for a student' })
  addConsent(
    @Param('id') id: string,
    @Body() dto: CreateConsentDto,
    @TenantId() centerId: string | null,
  ) {
    return this.studentsService.addConsent(id, dto, centerId ?? undefined);
  }

  @Get(':id/consents')
  @ApiOperation({ summary: 'Get all consent records for a student' })
  getConsents(@Param('id') id: string) {
    return this.studentsService.getConsents(id);
  }
}
