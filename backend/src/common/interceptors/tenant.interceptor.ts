import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../middleware/tenant.storage';
import { Role } from '@prisma/client';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const superRoles: Role[] = [Role.SUPER_ADMIN, Role.HO_STAFF];
    const isSuperUser = (user.roles as Role[])?.some((r) => superRoles.includes(r));

    if (isSuperUser) {
      return next.handle();
    }

    const ctx = tenantStorage.getStore();

    // If the route has a centerId param, validate it matches the JWT centerId
    const paramCenterId: string | undefined = request.params?.centerId;
    if (paramCenterId && ctx?.centerId && paramCenterId !== ctx.centerId) {
      throw new ForbiddenException('Access to this center is not allowed');
    }

    return next.handle();
  }
}
