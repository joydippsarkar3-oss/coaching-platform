import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { E2eService } from './e2e.service';
import { SeedDto, TeardownDto } from './dto/e2e.dto';

/**
 * Test-only fixtures for the Playwright suite. Deliberately unauthenticated —
 * the service refuses every call unless E2E_FIXTURES_ENABLED=true and NODE_ENV
 * is not production, and E2eModule is only registered under the same condition.
 * Excluded from the Swagger surface so it is not advertised as public API.
 */
@ApiExcludeController()
@Controller('e2e')
export class E2eController {
  constructor(private readonly svc: E2eService) {}

  @Post('seed')
  seed(@Body() dto: SeedDto) {
    return this.svc.seed(dto);
  }

  @Post('teardown')
  teardown(@Body() dto: TeardownDto) {
    return this.svc.teardown(dto);
  }

  @Get('otp')
  peekOtp(@Query('phone') phone: string) {
    return this.svc.peekOtp(phone);
  }
}
