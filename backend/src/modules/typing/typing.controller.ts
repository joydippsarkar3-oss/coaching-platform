import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TypingService } from './typing.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('typing')
@ApiBearerAuth('access-token')
@UseInterceptors(TenantInterceptor)
@Controller('api/v1/typing')
export class TypingController {
  constructor(private readonly typingService: TypingService) {}

  // ── Presets (public) ───────────────────────────────────────────────────────

  @Get('presets')
  @ApiOperation({ summary: 'List all preset configurations (CPCT, SSC, DEST) — public' })
  getPresets() {
    return this.typingService.getPresets();
  }

  // ── Passages ───────────────────────────────────────────────────────────────

  @Get('passages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List typing passages, optionally filtered by language and difficulty' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'hi'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  listPassages(
    @Query('language') language?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.typingService.listPassages(language, difficulty);
  }

  @Post('passages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER)
  @ApiOperation({ summary: 'Create a new typing passage — HO/CENTER_OWNER only' })
  createPassage(
    @Body()
    dto: {
      language: string;
      difficulty: string;
      text: string;
      source?: string;
    },
  ) {
    return this.typingService.createPassage(dto);
  }

  // ── Attempts ───────────────────────────────────────────────────────────────

  @Post('attempts/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Start a new typing attempt — returns attempt record + passage text' })
  startAttempt(
    @Body() dto: StartAttemptDto,
    @CurrentUser('id') studentId: string,
    @TenantId() centerId: string | null,
  ) {
    return this.typingService.startAttempt(dto, studentId, centerId ?? undefined);
  }

  @Post('attempts/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Submit a typing attempt with full keystroke log — returns scored result',
  })
  submitAttempt(
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser('id') studentId: string,
  ) {
    return this.typingService.submitAttempt(id, dto, studentId);
  }

  @Get('attempts/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get own attempt history with WPM sparkline trend data' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser('id') studentId: string,
    @Query('limit') limit?: string,
  ) {
    return this.typingService.getAttemptHistory(studentId, limit ? +limit : 20);
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Top net WPM leaderboard for the past 30 days' })
  @ApiQuery({ name: 'centerId', required: false })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'hi'] })
  @ApiQuery({ name: 'layout', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Query('centerId') centerId?: string,
    @Query('language') language?: string,
    @Query('layout') layout?: string,
    @Query('limit') limit?: string,
  ) {
    return this.typingService.getLeaderboard(
      centerId,
      language,
      layout,
      limit ? +limit : 10,
    );
  }
}
