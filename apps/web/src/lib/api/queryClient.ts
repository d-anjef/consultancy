import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/types/api.types';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Do not retry on auth/permission errors
          if (error instanceof ApiError) {
            if ([401, 403, 404].includes(error.statusCode)) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}