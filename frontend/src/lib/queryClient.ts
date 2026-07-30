/**
 * TanStack Query client configuration.
 *
 * Defaults tuned for a real-time auction platform:
 *   - staleTime: 30s — most data is relatively fresh
 *   - retry: 1 — fail fast on 4xx errors, retry once on network errors
 *   - No background refetch while window is hidden (saves connections)
 */

import { QueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

function shouldRetry(failureCount: number, error: unknown): boolean {
  const axiosError = error as AxiosError
  const status = axiosError?.response?.status
  // Never retry 4xx client errors
  if (status && status >= 400 && status < 500) return false
  return failureCount < 1
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
