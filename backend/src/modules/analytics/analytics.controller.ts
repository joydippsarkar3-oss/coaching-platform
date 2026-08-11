import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  private resolveCenter(
    user: { roles: Role[]; centerId: string | null },
    queryCenterId?: string,
  ): string | null {
    const isSuperAdmin = user.roles.includes(Role.SUPER_ADMIN);
    if (isSuperAdmin) {
      return queryCenterId ?? null;
    }
    // CENTER_ADMIN can only see their own center
    if (queryCenterId && queryCenterId !== user.centerId) {
      throw new ForbiddenException('Access to this center is not allowed');
    }
    return user.centerId;
  }

  @Get('summary')
  @Roles(Role.SUPER_ADMIN, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Get summary metrics for a date range' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  @ApiQuery({ name: 'centerId', required: false })
  getSummary(
    @CurrentUser() user: { roles: Role[]; centerId: string | null },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.resolveCenter(user, centerId);
    return this.svc.getSummary(cid, new Date(from), new Date(to));
  }

  @Get('courses')
  @Roles(Role.SUPER_ADMIN, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Get per-course performance metrics' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  @ApiQuery({ name: 'centerId', required: false })
  getCoursePerformance(
    @CurrentUser() user: { roles: Role[]; centerId: string | null },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.resolveCenter(user, centerId);
    return this.svc.getCoursePerformance(cid, new Date(from), new Date(to));
  }

  @Get('leaderboard')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Top 20 centers by revenue (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getCenterLeaderboard(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.svc.getCenterLeaderboard(new Date(from), new Date(to));
  }

  @Get('revenue')
  @Roles(Role.SUPER_ADMIN, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Monthly revenue breakdown for a given year' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'centerId', required: false })
  getRevenueByMonth(
    @CurrentUser() user: { roles: Role[]; centerId: string | null },
    @Query('year') year: string,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.resolveCenter(user, centerId);
    return this.svc.getRevenueByMonth(cid, parseInt(year, 10));
  }
}
