import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../middleware/tenant.storage';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method as string;
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!writeMethods.includes(method)) {
      return next.handle();
    }

    const ctx = tenantStorage.getStore();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await this.prisma.auditLog.create({
              data: {
                centerId: ctx?.centerId ?? null,
                userId: ctx?.userId ?? null,
                action: method,
                entity: this.resolveEntity(request.path as string),
                entityId: (request.params?.id as string) ?? null,
                ...(this.safeBody(request.body)
                  ? { newValue: this.safeBody(request.body) as Prisma.InputJsonValue }
                  : {}),
                ipAddress: this.getIp(request),
                userAgent: request.headers?.['user-agent'] ?? null,
              },
            });
          } catch {
            // Audit failures must never break the primary request
          }
        },
        error: async (err: Error) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                centerId: ctx?.centerId ?? null,
                userId: ctx?.userId ?? null,
                action: `${method}_FAILED`,
                entity: this.resolveEntity(request.path as string),
                entityId: (request.params?.id as string) ?? null,
                newValue: { error: err.message },
                ipAddress: this.getIp(request),
                userAgent: request.headers?.['user-agent'] ?? null,
              },
            });
          } catch {
            // Swallow
          }
        },
      }),
    );
  }

  private resolveEntity(path: string): string {
    const segments = path.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] ?? 'unknown';
  }

  private safeBody(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') return null;
    const sanitized = { ...(body as Record<string, unknown>) };
    delete sanitized['password'];
    delete sanitized['passwordHash'];
    delete sanitized['token'];
    delete sanitized['refreshToken'];
    return sanitized;
  }

  private getIp(req: any): string | null {
    return (
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0] ??
      req.ip ??
      null
    );
  }
}
