import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CenterCoursesService } from './center-courses.service';
import { GrantCourseDto, UpdateCenterCourseDto } from './dto/center-course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('center-courses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('centers/:centerId/courses')
export class CenterCoursesController {
  constructor(private readonly centerCoursesService: CenterCoursesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'Grant a course to a center (HO only)' })
  grant(@Param('centerId') centerId: string, @Body() dto: GrantCourseDto) {
    return this.centerCoursesService.grant(centerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses granted to a center' })
  findAll(@Param('centerId') centerId: string) {
    return this.centerCoursesService.findAllForCenter(centerId);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get a specific center-course grant' })
  findOne(@Param('centerId') centerId: string, @Param('courseId') courseId: string) {
    return this.centerCoursesService.findOne(centerId, courseId);
  }

  @Put(':courseId')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'Update custom fee or active flag for a center-course grant' })
  update(
    @Param('centerId') centerId: string,
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCenterCourseDto,
  ) {
    return this.centerCoursesService.update(centerId, courseId, dto);
  }

  @Delete(':courseId')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a course from a center' })
  revoke(@Param('centerId') centerId: string, @Param('courseId') courseId: string) {
    return this.centerCoursesService.revoke(centerId, courseId);
  }
}
