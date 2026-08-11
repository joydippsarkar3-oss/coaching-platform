import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { Course, CourseGrant } from '@/types/models';

export const catalogApi = {
  listCourses: (params?: CursorParams & { status?: string; category?: string }) =>
    api.get<PaginatedResponse<Course>>('/api/v1/catalog/courses', { params }),

  getCourse: (id: string) =>
    api.get<ApiResponse<Course>>(`/api/v1/catalog/courses/${id}`),

  createCourse: (data: Partial<Course>) =>
    api.post<ApiResponse<Course>>('/api/v1/catalog/courses', data),

  updateCourse: (id: string, data: Partial<Course>) =>
    api.put<ApiResponse<Course>>(`/api/v1/catalog/courses/${id}`, data),

  deleteCourse: (id: string) =>
    api.delete(`/api/v1/catalog/courses/${id}`),

  // Per-center grants
  getCenterGrants: (centerId: string) =>
    api.get<ApiResponse<CourseGrant[]>>(`/api/v1/catalog/grants/${centerId}`),

  upsertGrant: (data: CourseGrant) =>
    api.put<ApiResponse<CourseGrant>>('/api/v1/catalog/grants', data),

  bulkApplyByTier: (tier: string, courseIds: string[]) =>
    api.post('/api/v1/catalog/grants/bulk-apply', { tier, courseIds }),
};
