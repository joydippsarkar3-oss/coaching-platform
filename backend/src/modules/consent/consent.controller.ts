import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID, IsPhoneNumber } from 'class-validator';
import { ConsentService, ConsentPurpose } from './consent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class RecordConsentDto {
  @IsEnum(ConsentPurpose)
  purpose: ConsentPurpose;

  @IsString()
  noticeVersion: string;

  @IsEnum(['otp_verified', 'assisted_otp', 'written'])
  method: 'otp_verified' | 'assisted_otp' | 'written';

  @IsOptional()
  @IsUUID()
  guardianUserId?: string;

  @IsOptional()
  @IsUUID()
  centerId?: string;
}

class InitiateGuardianConsentDto {
  @IsUUID()
  studentUserId: string;

  @IsString()
  guardianPhone: string;

  @IsEnum(ConsentPurpose)
  purpose: ConsentPurpose;

  @IsString()
  noticeVersion: string;
}

class VerifyGuardianConsentDto {
  @IsUUID()
  consentRequestId: string;

  @IsString()
  otp: string;
}

@ApiTags('consent')
@Controller()
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * POST /api/v1/consent
   * Record a new consent entry (auth required).
   */
  @Post('consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a consent entry for the authenticated user' })
  async recordConsent(
    @Body() dto: RecordConsentDto,
    @CurrentUser() user: { id: string; centerId?: string },
  ) {
    return this.consentService.recordConsent({
      subjectUserId: user.id,
      guardianUserId: dto.guardianUserId,
      purpose: dto.purpose,
      noticeVersion: dto.noticeVersion,
      method: dto.method,
      centerId: dto.centerId ?? user.centerId,
    });
  }

  /**
   * DELETE /api/v1/consent/:id
   * Withdraw a consent (auth required, own record only).
   */
  @Delete('consent/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Withdraw a consent record (own records only)' })
  async withdrawConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.consentService.withdrawConsent(id, user.id);
  }

  /**
   * GET /api/v1/consent/check/:purpose
   * Check whether the authenticated user has granted a specific consent.
   */
  @Get('consent/check/:purpose')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check if consent is granted for a given purpose' })
  async checkConsent(
    @Param('purpose') purpose: ConsentPurpose,
    @CurrentUser() user: { id: string },
  ) {
    const granted = await this.consentService.checkConsent(user.id, purpose);
    return { userId: user.id, purpose, granted };
  }

  /**
   * POST /api/v1/consent/guardian/initiate
   * Initiate the guardian consent flow (sends OTP via WhatsApp/SMS).
   */
  @Post('consent/guardian/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate guardian consent — sends OTP to guardian phone' })
  async initiateGuardianConsent(@Body() dto: InitiateGuardianConsentDto) {
    return this.consentService.initiateGuardianConsent(dto);
  }

  /**
   * POST /api/v1/consent/guardian/verify
   * Verify guardian OTP and record the consent.
   */
  @Post('consent/guardian/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verify guardian OTP and finalise consent record' })
  async verifyGuardianConsent(@Body() dto: VerifyGuardianConsentDto) {
    return this.consentService.verifyGuardianConsent(dto.consentRequestId, dto.otp);
  }

  /**
   * GET /api/v1/dsar/export
   * DSAR data export — returns all personal data for the authenticated user.
   */
  @Get('dsar/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'DSAR: export all personal data for the authenticated user' })
  async exportUserData(@CurrentUser() user: { id: string }) {
    return this.consentService.exportUserData(user.id);
  }

  /**
   * POST /api/v1/dsar/erasure
   * Submit an erasure request (reviewed by HO; financial/cert records exempt).
   */
  @Post('dsar/erasure')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'DSAR: request erasure of personal data (HO-reviewed)' })
  async requestErasure(@CurrentUser() user: { id: string }) {
    return this.consentService.requestErasure(user.id, user.id);
  }
}
