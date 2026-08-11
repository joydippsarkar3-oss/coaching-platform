import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { Certificate, CertificateTemplate } from '@/types/models';

export const certificatesApi = {
  // Issuance queue
  listQueue: (params?: CursorParams & { status?: string }) =>
    api.get<PaginatedResponse<Certificate>>('/api/v1/certificates/queue', { params }),

  bulkApprove: (ids: string[]) =>
    api.post<ApiResponse<{ issued: number; failed: number }>>('/api/v1/certificates/bulk-approve', { ids }),

  // Registry
  search: (query: string) =>
    api.get<ApiResponse<Certificate[]>>('/api/v1/certificates/search', { params: { q: query } }),

  revoke: (id: string, reason: string) =>
    api.post(`/api/v1/certificates/${id}/revoke`, { reason }),

  // Legacy import
  importPreview: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/v1/certificates/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  importConfirm: (mappings: Record<string, string>, fileId: string) =>
    api.post('/api/v1/certificates/import/confirm', { mappings, fileId }),

  // Templates
  listTemplates: () =>
    api.get<ApiResponse<CertificateTemplate[]>>('/api/v1/certificate-templates'),

  getTemplate: (id: string) =>
    api.get<ApiResponse<CertificateTemplate>>(`/api/v1/certificate-templates/${id}`),

  updateTemplate: (id: string, data: Partial<CertificateTemplate>) =>
    api.put<ApiResponse<CertificateTemplate>>(`/api/v1/certificate-templates/${id}`, data),
};
