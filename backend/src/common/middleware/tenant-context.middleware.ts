import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { tenantStorage } from './tenant.storage';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    let centerId: string | null = null;
    let userId: string | null = null;
    let roles: string[] = [];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const secret = this.configService.get<string>('app.jwtSecret');
        const payload = this.jwtService.verify<{ sub: string; centerId?: string; roles?: string[] }>(
          token,
          { secret },
        );
        centerId = payload.centerId ?? null;
        userId = payload.sub;
        roles = payload.roles ?? [];
      } catch {
        // Token invalid — context remains empty; guards will reject if auth is required
      }
    }

    tenantStorage.run({ centerId, userId, roles }, () => next());
  }
}
