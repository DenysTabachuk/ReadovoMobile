import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { shouldRetryQuery } from './utils/shouldRetryQuery';

type QueryProviderProps = {
  children: ReactNode;
};

const QUERY_STALE_TIME_MS = 60_000;

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetryQuery,
            staleTime: QUERY_STALE_TIME_MS,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
