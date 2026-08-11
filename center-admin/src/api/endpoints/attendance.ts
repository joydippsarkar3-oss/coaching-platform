import apiClient from '../client'
import type { ApiResponse } from '@/types/api'
import type { AttendanceRecord } from '@/types/models'

export const attendanceApi = {
  getRegister: (batchId: string, date: string) =>
    apiClient.get<ApiResponse<AttendanceRecord[]>>('/attendance', { params: { batchId, date } }),

  markBulk: (
    records: Array<{ studentId: string; enrollmentId: string; date: string; status: string }>,
  ) => apiClient.post<ApiResponse<{ saved: number }>>('/attendance/bulk', { records }),

  getSummary: (batchId: string, month: string) =>
    apiClient.get<
      ApiResponse<Array<{ studentId: string; present: number; absent: number; total: number }>>
    >('/attendance/summary', { params: { batchId, month } }),
}
