import useSWR, { type SWRConfiguration } from 'swr';
import apiClient from '@/api/client';

export function usePollingApi<T>(
  url: string | null,
  intervalMs: number = 60_000,
  config?: SWRConfiguration<T>
) {
  return useSWR<T>(
    url,
    (u: string) => apiClient.get<T>(u).then((r) => r.data as T),
    {
      refreshInterval: intervalMs,
      revalidateOnFocus: true,
      ...config,
    }
  );
}
