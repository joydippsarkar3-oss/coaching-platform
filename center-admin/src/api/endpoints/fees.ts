import apiClient from '../client'
import type {
  ApiResponse,
  CollectPaymentRequest,
  CollectPaymentResponse,
  DuesAgingBuckets,
  FeeInstallment,
} from '@/types/api'

export const feesApi = {
  getInstallments: (studentId: string) =>
    apiClient.get<ApiResponse<FeeInstallment[]>>('/fees/installments', { params: { studentId } }),

  collectPayment: (payload: CollectPaymentRequest) =>
    apiClient.post<ApiResponse<CollectPaymentResponse>>('/fees/collect', payload),

  getReceipt: (receiptId: string) =>
    apiClient.get<Blob>(`/fees/receipts/${receiptId}`, { responseType: 'blob' }),

  getDuesAging: () => apiClient.get<ApiResponse<DuesAgingBuckets>>('/fees/dues-aging'),

  waiveLateFee: (installmentId: string) =>
    apiClient.post<ApiResponse<FeeInstallment>>(
      `/fees/installments/${installmentId}/waive-late-fee`,
    ),
}
