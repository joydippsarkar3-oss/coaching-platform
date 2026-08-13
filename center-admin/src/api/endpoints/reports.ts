import { getBlob } from '../client'

export const reportsApi = {
  exportAdmissions: (params: { startDate: string; endDate: string }) =>
    getBlob('/reports/admissions', params),

  exportFees: (params: { startDate: string; endDate: string }) =>
    getBlob('/reports/fees', params),

  exportAttendance: (params: { batchId?: string; month: string }) =>
    getBlob('/reports/attendance', params),
}
