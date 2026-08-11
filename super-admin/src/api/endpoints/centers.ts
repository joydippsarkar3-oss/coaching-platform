import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { Center, CenterKycChecklist } from '@/types/models';

export const centersApi = {
  list: (params?: CursorParams & { status?: string }) =>
    api.get<PaginatedResponse<Center>>('/api/v1/centers', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Center>>(`/api/v1/centers/${id}`),

  create: (data: Partial<Center>) =>
    api.post<ApiResponse<Center>>('/api/v1/centers', data),

  update: (id: string, data: Partial<Center>) =>
    api.put<ApiResponse<Center>>(`/api/v1/centers/${id}`, data),

  provision: (id: string) =>
    api.post<ApiResponse<{ loginUrl: string; username: string; tempPassword: string }>>(
      `/api/v1/centers/${id}/provision`
    ),

  freeze: (id: string, reason: string) =>
    api.post(`/api/v1/centers/${id}/freeze`, { reason }),

  unfreeze: (id: string, reason: string) =>
    api.post(`/api/v1/centers/${id}/unfreeze`, { reason }),

  close: (id: string, reason: string) =>
    api.post(`/api/v1/centers/${id}/close`, { reason }),

  getKyc: (id: string) =>
    api.get<ApiResponse<CenterKycChecklist>>(`/api/v1/centers/${id}/kyc`),

  updateKyc: (id: string, data: Partial<CenterKycChecklist>) =>
    api.put<ApiResponse<CenterKycChecklist>>(`/api/v1/centers/${id}/kyc`, data),

  uploadAgreement: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/v1/centers/${id}/agreement`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  leaderboard: (params?: { limit?: number }) =>
    api.get('/api/v1/centers/leaderboard', { params }),
};
