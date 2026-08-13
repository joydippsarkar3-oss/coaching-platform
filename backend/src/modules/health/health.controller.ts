import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — the process is up. No dependencies touched. */
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok', uptimeSeconds: Math.floor(process.uptime()) };
  }

  /** Readiness — the process can serve traffic, i.e. the database answers. */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (checks database connectivity)' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      // Body over exception so load balancers get a parseable payload.
      return { status: 'degraded', database: 'down' };
    }
  }
}
