import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { Question, QuestionBank } from '@/types/models';

export const questionsApi = {
  listBanks: (params?: CursorParams) =>
    api.get<PaginatedResponse<QuestionBank>>('/api/v1/question-banks', { params }),

  listQuestions: (bankId: string, params?: CursorParams & { type?: string; difficulty?: string; status?: string }) =>
    api.get<PaginatedResponse<Question>>(`/api/v1/question-banks/${bankId}/questions`, { params }),

  getQuestion: (id: string) =>
    api.get<ApiResponse<Question>>(`/api/v1/questions/${id}`),

  createQuestion: (data: Partial<Question>) =>
    api.post<ApiResponse<Question>>('/api/v1/questions', data),

  updateQuestion: (id: string, data: Partial<Question>) =>
    api.put<ApiResponse<Question>>(`/api/v1/questions/${id}`, data),

  deleteQuestion: (id: string) =>
    api.delete(`/api/v1/questions/${id}`),

  updateStatus: (id: string, status: string) =>
    api.patch(`/api/v1/questions/${id}/status`, { status }),

  bulkImport: (bankId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('bankId', bankId);
    return api.post('/api/v1/questions/bulk-import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  toggleBankLock: (bankId: string, locked: boolean) =>
    api.patch(`/api/v1/question-banks/${bankId}/lock`, { locked }),
};
