import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/endpoints/auth';
import type { LoginCredentials } from '@/types/models';

export function useAuth() {
  const { user, tokens, isAuthenticated, setAuth, clearAuth, hasPermission } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    const res = await authApi.login(credentials);
    const { user: authUser, tokens: authTokens } = res.data;
    setAuth(authUser, authTokens);
    return authUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  };

  return { user, tokens, isAuthenticated, login, logout, hasPermission };
}
