import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('courses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'Create a new course (HO only)' })
  create(@Body() dto: CreateCourseDto, @CurrentUser('roles') roles: Role[]) {
    return this.coursesService.create(dto, roles);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses with optional status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.coursesService.findAll(+page, +limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID (includes content items)' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'Update a course (HO only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser('roles') roles: Role[]) {
    return this.coursesService.update(id, dto, roles);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course (SUPER_ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
