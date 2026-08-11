import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { WhatsAppTemplate, Broadcast } from '@/types/models';

export const commsApi = {
  // Templates
  listTemplates: (params?: CursorParams) =>
    api.get<PaginatedResponse<WhatsAppTemplate>>('/api/v1/comms/templates', { params }),

  createTemplate: (data: Partial<WhatsAppTemplate>) =>
    api.post<ApiResponse<WhatsAppTemplate>>('/api/v1/comms/templates', data),

  updateTemplate: (id: string, data: Partial<WhatsAppTemplate>) =>
    api.put<ApiResponse<WhatsAppTemplate>>(`/api/v1/comms/templates/${id}`, data),

  submitToMeta: (id: string) =>
    api.post(`/api/v1/comms/templates/${id}/submit-meta`),

  // Broadcasts
  listBroadcasts: (params?: CursorParams) =>
    api.get<PaginatedResponse<Broadcast>>('/api/v1/comms/broadcasts', { params }),

  createBroadcast: (data: Partial<Broadcast>) =>
    api.post<ApiResponse<Broadcast>>('/api/v1/comms/broadcasts', data),

  sendBroadcast: (id: string) =>
    api.post(`/api/v1/comms/broadcasts/${id}/send`),

  // Analytics
  getDeliveryStats: (templateId: string) =>
    api.get(`/api/v1/comms/analytics/${templateId}`),
};
