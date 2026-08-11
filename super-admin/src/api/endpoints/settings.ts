import { api } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { PlatformSettings } from '@/types/models';

export const settingsApi = {
  get: () =>
    api.get<ApiResponse<PlatformSettings>>('/api/v1/settings'),

  update: (data: Partial<PlatformSettings>) =>
    api.put<ApiResponse<PlatformSettings>>('/api/v1/settings', data),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<{ url: string }>>('/api/v1/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadPwaIcon: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<{ url: string }>>('/api/v1/settings/pwa-icon', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
