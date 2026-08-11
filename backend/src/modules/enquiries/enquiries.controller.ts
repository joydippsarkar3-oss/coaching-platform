import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto, UpdateEnquiryDto, CreateFollowUpDto } from './dto/enquiry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('enquiries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new enquiry (CRM lead)' })
  create(@Body() dto: CreateEnquiryDto, @TenantId() centerId: string | null) {
    return this.enquiriesService.create(dto, centerId ?? undefined);
  }

  @Get()
  @ApiOperation({ summary: 'List enquiries with optional search and pagination' })
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
    return this.enquiriesService.findAll(centerId, +page, +limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an enquiry with all follow-ups' })
  findOne(@Param('id') id: string) {
    return this.enquiriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update enquiry details or assignment' })
  update(@Param('id') id: string, @Body() dto: UpdateEnquiryDto) {
    return this.enquiriesService.update(id, dto);
  }

  @Put(':id/convert')
  @ApiOperation({ summary: 'Mark an enquiry as converted (student enrolled)' })
  markConverted(@Param('id') id: string) {
    return this.enquiriesService.markConverted(id);
  }

  @Post(':id/follow-ups')
  @ApiOperation({ summary: 'Add a follow-up log to an enquiry' })
  addFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
    @CurrentUser('id') userId: string,
    @TenantId() centerId: string | null,
  ) {
    return this.enquiriesService.addFollowUp(id, dto, userId, centerId ?? undefined);
  }

  @Get(':id/follow-ups')
  @ApiOperation({ summary: 'Get all follow-up logs for an enquiry' })
  getFollowUps(@Param('id') id: string) {
    return this.enquiriesService.getFollowUps(id);
  }
}
