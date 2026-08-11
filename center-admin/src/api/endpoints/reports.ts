import apiClient from '../client'

export const reportsApi = {
  exportAdmissions: (params: { startDate: string; endDate: string }) =>
    apiClient.get<Blob>('/reports/admissions', { params, responseType: 'blob' }),

  exportFees: (params: { startDate: string; endDate: string }) =>
    apiClient.get<Blob>('/reports/fees', { params, responseType: 'blob' }),

  exportAttendance: (params: { batchId?: string; month: string }) =>
    apiClient.get<Blob>('/reports/attendance', { params, responseType: 'blob' }),
}
