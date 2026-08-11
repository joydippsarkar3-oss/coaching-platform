import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { Exam } from '@/types/models';

export const examsApi = {
  list: (params?: CursorParams & { type?: string; status?: string }) =>
    api.get<PaginatedResponse<Exam>>('/api/v1/exams', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Exam>>(`/api/v1/exams/${id}`),

  create: (data: Partial<Exam>) =>
    api.post<ApiResponse<Exam>>('/api/v1/exams', data),

  update: (id: string, data: Partial<Exam>) =>
    api.put<ApiResponse<Exam>>(`/api/v1/exams/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/exams/${id}`),

  toggleBankLock: (id: string, locked: boolean) =>
    api.patch(`/api/v1/exams/${id}/lock-bank`, { locked }),
};
