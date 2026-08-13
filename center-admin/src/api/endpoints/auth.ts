import apiClient from '../client'
import type { LoginOtpRequest, LoginOtpVerifyRequest, TokenPair } from '@/types/api'
import type { User } from '@/types/models'

/**
 * Paths and payloads mirror the backend AuthController exactly: the OTP routes
 * return a bare token pair (no response envelope), and the verify body field is
 * `code`, not `otp`.
 */
export const authApi = {
  sendOtp: (payload: LoginOtpRequest) =>
    apiClient.post<{ message: string }>('/auth/otp/request', payload),

  verifyOtp: (payload: LoginOtpVerifyRequest) =>
    apiClient.post<TokenPair>('/auth/otp/verify', {
      phone: payload.phone,
      code: payload.otp,
    }),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>('/auth/refresh', { refreshToken }),

  /** Current profile. Lives on the users controller, not /auth. */
  me: () => apiClient.get<User>('/users/me'),
}
