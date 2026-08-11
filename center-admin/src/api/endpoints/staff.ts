import apiClient from '../client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { StaffMember } from '@/types/models'

export const staffApi = {
  list: () => apiClient.get<ApiResponse<PaginatedResponse<StaffMember>>>('/staff'),
  get: (id: string) => apiClient.get<ApiResponse<StaffMember>>(`/staff/${id}`),
  create: (payload: Omit<StaffMember, 'id' | 'joinedAt'>) =>
    apiClient.post<ApiResponse<StaffMember>>('/staff', payload),
  update: (id: string, payload: Partial<StaffMember>) =>
    apiClient.patch<ApiResponse<StaffMember>>(`/staff/${id}`, payload),
  deactivate: (id: string) =>
    apiClient.post<ApiResponse<StaffMember>>(`/staff/${id}/deactivate`),
}
