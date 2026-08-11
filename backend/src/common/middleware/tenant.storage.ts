import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  centerId: string | null;
  userId: string | null;
  roles: string[];
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();
