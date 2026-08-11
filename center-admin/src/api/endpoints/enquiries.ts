import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, CreateEnquiryRequest, EnquiryListParams } from '@/types/api'
import type { Enquiry } from '@/types/models'

export const enquiriesApi = {
  list: (params: EnquiryListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<Enquiry>>>('/enquiries', { params }),

  get: (id: string) => apiClient.get<ApiResponse<Enquiry>>(`/enquiries/${id}`),

  create: (payload: CreateEnquiryRequest) =>
    apiClient.post<ApiResponse<Enquiry>>('/enquiries', payload),

  update: (id: string, payload: Partial<Enquiry>) =>
    apiClient.patch<ApiResponse<Enquiry>>(`/enquiries/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/enquiries/${id}`),

  checkDuplicate: (phone: string) =>
    apiClient.get<ApiResponse<{ isDuplicate: boolean; existingId?: string }>>(
      '/enquiries/check-duplicate',
      { params: { phone } },
    ),
}
