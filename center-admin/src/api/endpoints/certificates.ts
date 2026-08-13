import apiClient, { getBlob } from '../client'
import type { ApiResponse, CertificateIssuanceRequest } from '@/types/api'
import type { Certificate } from '@/types/models'

export const certificatesApi = {
  getEligible: () => apiClient.get<ApiResponse<Certificate[]>>('/certificates/eligible'),

  requestIssuance: (payload: CertificateIssuanceRequest) =>
    apiClient.post<ApiResponse<{ requested: number; hoFeeTotal: number }>>(
      '/certificates/request',
      payload,
    ),

  getStatus: () => apiClient.get<ApiResponse<Certificate[]>>('/certificates'),

  download: (certificateId: string) =>
    getBlob(`/certificates/${certificateId}/download`),
}
