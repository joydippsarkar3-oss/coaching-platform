import apiClient from '../client'
import type { ApiResponse } from '@/types/api'

export interface ExamTopper {
  studentId: string
  studentName: string
  score: number
  totalMarks: number
  rank: number
}

export interface ExamOption {
  id: string
  name: string
  courseName: string
}

export const marketingApi = {
  listPublishedExams: () =>
    apiClient.get<ApiResponse<ExamOption[]>>('/exams/published'),

  getToppers: (examId: string) =>
    apiClient.get<ApiResponse<ExamTopper[]>>(`/exams/${examId}/toppers`, {
      params: { limit: 3 },
    }),
}
