import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
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

  // The backend issues stateless JWTs with no revocation endpoint, so logging
  // out means discarding the tokens locally.
  const logout = useCallback(() => {
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])

  return { user, isAuthenticated, login, logout }
}
