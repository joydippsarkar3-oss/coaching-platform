import useSWR, { type SWRConfiguration } from 'swr';
import apiClient from '@/api/client';

export function useApi<T>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(
    url,
    (u: string) => apiClient.get<T>(u).then((r) => r.data as T),
    config
  );
}
