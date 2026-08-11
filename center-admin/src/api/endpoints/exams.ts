import apiClient from '../client'
import type { ApiResponse, ExamScheduleRequest } from '@/types/api'
import type { Exam, ExamAttempt } from '@/types/models'

export const examsApi = {
  list: () => apiClient.get<ApiResponse<Exam[]>>('/exams'),

  schedule: (payload: ExamScheduleRequest) =>
    apiClient.post<ApiResponse<Exam>>('/exams/schedule', payload),

  getAttempts: (examId: string) =>
    apiClient.get<ApiResponse<ExamAttempt[]>>(`/exams/${examId}/attempts`),

  getLiveStatus: (examId: string) =>
    apiClient.get<ApiResponse<{ inProgress: number; flagged: ExamAttempt[] }>>(
      `/exams/${examId}/live`,
    ),

  generateLoginSlips: (examId: string) =>
    apiClient.get<Blob>(`/exams/${examId}/login-slips`, { responseType: 'blob' }),
}
