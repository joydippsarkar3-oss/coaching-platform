import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { CreateFeePlanDto, CollectPaymentDto } from './dto/fee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';

@ApiTags('fees')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('plans')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER)
  @ApiOperation({ summary: 'Create a fee plan for a center' })
  createFeePlan(@Body() dto: CreateFeePlanDto, @TenantId() centerId: string | null) {
    return this.feesService.createFeePlan(dto, centerId ?? undefined);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all active fee plans' })
  @ApiQuery({ name: 'centerId', required: false })
  findAllFeePlans(@Query('centerId') centerId?: string) {
    return this.feesService.findAllFeePlans(centerId);
  }

  @Get('enrollments/:enrollmentId/installments')
  @ApiOperation({ summary: 'Get installment schedule for an enrollment' })
  getInstallments(@Param('enrollmentId') enrollmentId: string) {
    return this.feesService.getInstallments(enrollmentId);
  }

  @Get('enrollments/:enrollmentId/payments')
  @ApiOperation({ summary: 'Get full payment history for an enrollment' })
  getPaymentHistory(@Param('enrollmentId') enrollmentId: string) {
    return this.feesService.getPaymentHistory(enrollmentId);
  }

  @Post('payments')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Collect a payment against an installment' })
  collectPayment(
    @Body() dto: CollectPaymentDto,
    @TenantId() centerId: string | null,
    @CurrentUser('id') userId: string,
  ) {
    return this.feesService.collectPayment(dto, centerId ?? undefined, userId);
  }
}
