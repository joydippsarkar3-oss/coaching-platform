import apiClient from '../client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { Batch } from '@/types/models'

export const batchesApi = {
  list: (params?: { courseId?: string; status?: string; page?: number; pageSize?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Batch>>>('/batches', { params }),

  get: (id: string) => apiClient.get<ApiResponse<Batch>>(`/batches/${id}`),

  create: (payload: Omit<Batch, 'id' | 'filledSeats'>) =>
    apiClient.post<ApiResponse<Batch>>('/batches', payload),

  update: (id: string, payload: Partial<Batch>) =>
    apiClient.patch<ApiResponse<Batch>>(`/batches/${id}`, payload),

  close: (id: string) => apiClient.post<ApiResponse<Batch>>(`/batches/${id}/close`),

  getStudents: (id: string) =>
    apiClient.get<ApiResponse<Array<{ studentId: string; studentName: string; enrollmentId: string }>>>(
      `/batches/${id}/students`,
    ),
}
