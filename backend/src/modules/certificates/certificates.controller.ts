import {
  Controller, Get, Post, Put, Body, Param, Query, Req,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { CertificatesService } from './certificates.service';
import { RequestCertificateDto, IssueCertificateDto } from './dto/certificate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // Public verification endpoint — no auth required
  @Get('verify/:certificateNo')
  @ApiOperation({ summary: 'Publicly verify a certificate by certificate number' })
  verify(@Param('certificateNo') certificateNo: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.certificatesService.verifyByNumber(certificateNo, ip);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(TenantInterceptor)
  @Post('request')
  @ApiOperation({ summary: 'Request a certificate for a completed enrollment' })
  request(@Body() dto: RequestCertificateDto, @TenantId() centerId: string | null) {
    return this.certificatesService.request(dto, centerId ?? undefined);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(TenantInterceptor)
  @Get()
  @ApiOperation({ summary: 'List certificates with optional filters' })
  @ApiQuery({ name: 'centerId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('centerId') centerId?: string,
    @Query('studentId') studentId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.certificatesService.findAll(centerId, studentId, +page, +limit);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(TenantInterceptor)
  @Get(':id')
  @ApiOperation({ summary: 'Get certificate details by ID' })
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(TenantInterceptor)
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF, Role.CENTER_OWNER)
  @Put(':id/issue')
  @ApiOperation({ summary: 'Issue a requested certificate (HO or center owner)' })
  issue(@Param('id') id: string, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(TenantInterceptor)
  @Roles(Role.SUPER_ADMIN, Role.HO_STAFF)
  @Put(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an issued certificate (HO only)' })
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id);
  }
}
