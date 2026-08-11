import apiClient from '../client'
import type { ApiResponse } from '@/types/api'
import type { Center } from '@/types/models'

export const settingsApi = {
  getCenter: () => apiClient.get<ApiResponse<Center>>('/center'),

  updateCenter: (payload: Partial<Center>) =>
    apiClient.patch<ApiResponse<Center>>('/center', payload),

  uploadLogo: (file: File) => {
    const form = new FormData()
    form.append('logo', file)
    return apiClient.post<ApiResponse<{ logoUrl: string }>>('/center/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  submitKyc: (payload: Record<string, string>) =>
    apiClient.post<ApiResponse<Center>>('/center/kyc', payload),
}
