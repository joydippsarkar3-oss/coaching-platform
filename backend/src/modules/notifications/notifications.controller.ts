import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({ summary: 'Send a notification via the specified channel' })
  send(@Body() dto: SendNotificationDto, @TenantId() centerId: string | null) {
    return this.notificationsService.send(dto, centerId ?? undefined);
  }

  @Get()
  @ApiOperation({ summary: 'List notifications with optional filters' })
  @ApiQuery({ name: 'centerId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('centerId') centerId?: string,
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.findAll(centerId, userId, +page, +limit);
  }

  @Get('costs')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER)
  @ApiOperation({
    summary: 'Communications spend for the center, split by channel',
    description:
      'Only SENT messages are billed. WhatsApp is charged per conversation, so ' +
      'follow-ups inside an open 24-hour window cost nothing.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date, inclusive' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date, inclusive' })
  getCosts(
    @TenantId() centerId: string | null,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationsService.getCostSummary(
      centerId ?? undefined,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('whatsapp-window/:phone')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER, Role.CENTER_STAFF)
  @ApiOperation({
    summary: 'Whether free-form WhatsApp text may be sent to this number',
    description:
      'When closed, an outbound send must name a Meta-approved template.',
  })
  getWhatsappWindow(@Param('phone') phone: string) {
    return this.notificationsService.getWhatsappWindow(phone);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }
}
