import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { AuthUser, AuthTokens, LoginCredentials } from '@/types/models';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>('/api/v1/auth/login', credentials),

  logout: () => api.post('/api/v1/auth/logout'),

  me: () => api.get<ApiResponse<AuthUser>>('/api/v1/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/api/v1/auth/refresh', { refreshToken }),

  requestOtp: (email: string) =>
    api.post('/api/v1/auth/otp/request', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post('/api/v1/auth/otp/verify', { email, otp }),
};
