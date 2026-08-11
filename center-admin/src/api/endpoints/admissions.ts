import apiClient from '../client'
import type { ApiResponse, AdmissionWizardPayload } from '@/types/api'
import type { Enrollment, Course, Batch, FeePlan } from '@/types/models'

export const admissionsApi = {
  getCourses: () => apiClient.get<ApiResponse<Course[]>>('/courses'),

  getBatches: (courseId: string) =>
    apiClient.get<ApiResponse<Batch[]>>('/batches', { params: { courseId } }),

  getFeePlans: (courseId: string) =>
    apiClient.get<ApiResponse<FeePlan[]>>('/fee-plans', { params: { courseId } }),

  createAdmission: (payload: AdmissionWizardPayload) =>
    apiClient.post<ApiResponse<Enrollment>>('/admissions', payload),

  sendConsentOtp: (studentId: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/students/${studentId}/consent-otp`),

  verifyConsentOtp: (studentId: string, otp: string) =>
    apiClient.post<ApiResponse<{ verified: boolean }>>(
      `/students/${studentId}/consent-otp/verify`,
      { otp },
    ),

  getUpiQr: (amount: number, reference: string) =>
    apiClient.post<ApiResponse<{ qrData: string; upiString: string }>>('/payments/upi-qr', {
      amount,
      reference,
    }),

  getAdmissionLetter: (enrollmentId: string) =>
    apiClient.get<Blob>(`/admissions/${enrollmentId}/letter`, { responseType: 'blob' }),
}
