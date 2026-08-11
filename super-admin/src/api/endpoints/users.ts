import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { HoStaff, ActiveSession } from '@/types/models';

export const usersApi = {
  listStaff: (params?: CursorParams) =>
    api.get<PaginatedResponse<HoStaff>>('/api/v1/users/staff', { params }),

  getStaff: (id: string) =>
    api.get<ApiResponse<HoStaff>>(`/api/v1/users/staff/${id}`),

  inviteStaff: (data: { email: string; role: string; permissions: string[] }) =>
    api.post<ApiResponse<HoStaff>>('/api/v1/users/staff/invite', data),

  updateStaff: (id: string, data: Partial<HoStaff>) =>
    api.put<ApiResponse<HoStaff>>(`/api/v1/users/staff/${id}`, data),

  deactivateStaff: (id: string) =>
    api.post(`/api/v1/users/staff/${id}/deactivate`),

  listSessions: () =>
    api.get<ApiResponse<ActiveSession[]>>('/api/v1/users/sessions'),

  revokeSession: (sessionId: string) =>
    api.delete(`/api/v1/users/sessions/${sessionId}`),

  require2Fa: (enabled: boolean) =>
    api.post('/api/v1/users/settings/require-2fa', { enabled }),
};
