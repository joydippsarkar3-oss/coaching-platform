import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto, StartAttemptDto, SubmitAttemptDto } from './dto/exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';

@ApiTags('exams')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Create a new exam' })
  create(@Body() dto: CreateExamDto, @TenantId() centerId: string | null) {
    return this.examsService.create(dto, centerId ?? undefined);
  }

  @Get()
  @ApiOperation({ summary: 'List exams with optional center filter' })
  @ApiQuery({ name: 'centerId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('centerId') centerId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.examsService.findAll(centerId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam details' })
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Update exam metadata or status' })
  update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(id, dto);
  }

  @Post(':id/attempts/start')
  @ApiOperation({ summary: 'Start an exam attempt for a student' })
  startAttempt(
    @Param('id') id: string,
    @Body() dto: StartAttemptDto,
    @TenantId() centerId: string | null,
  ) {
    return this.examsService.startAttempt(id, dto, centerId ?? undefined);
  }

  @Put('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit answers for an in-progress attempt; auto-evaluates and returns score' })
  submitAttempt(@Param('attemptId') attemptId: string, @Body() dto: SubmitAttemptDto) {
    return this.examsService.submitAttempt(attemptId, dto);
  }

  @Get(':id/attempts')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.TEACHER)
  @ApiOperation({ summary: 'Get all attempts for an exam' })
  getAttempts(@Param('id') id: string) {
    return this.examsService.getAttempts(id);
  }
}
