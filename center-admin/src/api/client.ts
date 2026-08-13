import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// The backend mounts every route under /api/v1, so the prefix lives here and
// endpoint modules use bare paths like '/students'.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const BASE_URL = `${API_ORIGIN.replace(/\/+$/, '')}/api/v1`

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Attach Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

// 401 → refresh → retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers['Authorization'] = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    isRefreshing = true
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
      )
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      processQueue(data.accessToken)
      original.headers['Authorization'] = `Bearer ${data.accessToken}`
      return apiClient(original)
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

/**
 * GETs a binary payload and unwraps it to the raw Blob, since every download
 * call site feeds the result straight into URL.createObjectURL.
 */
export async function getBlob(
  url: string,
  params?: Record<string, unknown>,
): Promise<Blob> {
  const res = await apiClient.get<Blob>(url, { params, responseType: 'blob' })
  return res.data
}

export default apiClient
