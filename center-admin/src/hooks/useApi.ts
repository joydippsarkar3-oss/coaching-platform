import useSWR, { type SWRConfiguration } from 'swr'
import apiClient from '@/api/client'
import type { ApiResponse } from '@/types/api'

/**
 * SWR-based hook that fetches from apiClient and returns typed data.
 * Pass null as key to disable fetching.
 */
export function useApi<T>(
  key: string | null,
  config?: SWRConfiguration,
) {
  const fetcher = async (url: string): Promise<T> => {
    const res = await apiClient.get<ApiResponse<T>>(url)
    return res.data.data
  }

  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    ...config,
  })
}

/**
 * Polling variant — refresh every `intervalMs` milliseconds.
 */
export function usePollingApi<T>(key: string | null, intervalMs: number, config?: SWRConfiguration) {
  return useApi<T>(key, { refreshInterval: intervalMs, ...config })
}
