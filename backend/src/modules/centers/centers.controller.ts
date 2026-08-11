import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CentersService } from './centers.service';
import { CreateCenterDto, UpdateCenterDto } from './dto/center.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('centers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'Create a new franchise center (HO only)' })
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'List all franchise centers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.centersService.findAll(+page, +limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single center by ID' })
  findOne(@Param('id') id: string) {
    return this.centersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @ApiOperation({ summary: 'Update a center' })
  update(@Param('id') id: string, @Body() dto: UpdateCenterDto) {
    return this.centersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a center (SUPER_ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.centersService.remove(id);
  }
}
