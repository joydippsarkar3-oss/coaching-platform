import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { AuditLog, RetentionJob } from '@/types/models';

export const auditApi = {
  listLogs: (params?: CursorParams & {
    actorId?: string;
    entityType?: string;
    action?: string;
    from?: string;
    to?: string;
  }) =>
    api.get<PaginatedResponse<AuditLog>>('/api/v1/audit/logs', { params }),

  listRetentionJobs: () =>
    api.get<ApiResponse<RetentionJob[]>>('/api/v1/audit/retention-jobs'),

  consentStats: () =>
    api.get('/api/v1/audit/consent-stats'),
};
