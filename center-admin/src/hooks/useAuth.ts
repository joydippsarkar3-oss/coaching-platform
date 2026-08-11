import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authApi } from '@/api/endpoints/auth'
import type { User } from '@/types/models'

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(
    (userData: User, accessToken: string, refreshToken: string) => {
      setAuth(userData, accessToken, refreshToken)
      navigate('/dashboard')
    },
    [setAuth, navigate],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore errors on logout
    } finally {
      clearAuth()
      navigate('/login')
    }
  }, [clearAuth, navigate])

  return { user, isAuthenticated, login, logout }
}
