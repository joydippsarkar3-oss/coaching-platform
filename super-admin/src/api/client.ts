import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/auth.store';

// ─── Refresh queue ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  refreshQueue = [];
}

// ─── Audit log interceptor ─────────────────────────────────────────────────

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

function logAudit(config: InternalAxiosRequestConfig) {
  if (!config.method) return;
  if (!MUTATING_METHODS.has(config.method.toLowerCase())) return;
  const entry = {
    timestamp: new Date().toISOString(),
    method: config.method.toUpperCase(),
    url: config.url,
    payload: config.data,
  };
  // Store locally — AuditCompliance page can read this
  try {
    const existing = JSON.parse(sessionStorage.getItem('bb_audit_log') ?? '[]');
    existing.unshift(entry);
    sessionStorage.setItem('bb_audit_log', JSON.stringify(existing.slice(0, 200)));
  } catch {
    // silent
  }
}

// ─── Create instance ──────────────────────────────────────────────────────────

export function createApiClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request: attach Bearer token + audit
  instance.interceptors.request.use((config) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    logAudit(config);
    return config;
  });

  // Response: handle 401 with token refresh
  instance.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          });
        }

        isRefreshing = true;
        const refreshToken = useAuthStore.getState().tokens?.refreshToken;

        try {
          const res = await axios.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
            `${baseURL}/api/v1/auth/refresh`,
            { refreshToken }
          );
          const newTokens = res.data;
          useAuthStore.getState().setTokens({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresIn: newTokens.expiresIn,
          });
          processQueue(null, newTokens.accessToken);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
);

export default apiClient;

// Typed helper wrappers
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
};
