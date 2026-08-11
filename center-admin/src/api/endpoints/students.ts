import apiClient from '../client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { Student, Enrollment, AttendanceRecord, Certificate } from '@/types/models'

export interface StudentListParams {
  search?: string
  batchId?: string
  courseId?: string
  status?: string
  hasDues?: boolean
  page?: number
  pageSize?: number
}

export const studentsApi = {
  list: (params: StudentListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<Student>>>('/students', { params }),

  get: (id: string) => apiClient.get<ApiResponse<Student>>(`/students/${id}`),

  getEnrollments: (id: string) =>
    apiClient.get<ApiResponse<Enrollment[]>>(`/students/${id}/enrollments`),

  getAttendance: (id: string, params?: { enrollmentId?: string; month?: string }) =>
    apiClient.get<ApiResponse<AttendanceRecord[]>>(`/students/${id}/attendance`, { params }),

  getCertificates: (id: string) =>
    apiClient.get<ApiResponse<Certificate[]>>(`/students/${id}/certificates`),

  getConsents: (id: string) =>
    apiClient.get<ApiResponse<Array<{ type: string; consentedAt: string; method: string }>>>(
      `/students/${id}/consents`,
    ),

  addNote: (id: string, note: string) =>
    apiClient.post<ApiResponse<{ id: string; note: string; createdAt: string }>>(
      `/students/${id}/notes`,
      { note },
    ),

  searchByPhone: (phone: string) =>
    apiClient.get<ApiResponse<Student | null>>('/students/search', { params: { phone } }),
}
