import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** Fresh, retry-disabled QueryClient per test so failures surface immediately instead of retrying
 * into a timeout, and so no cached data leaks between tests. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function withQueryClient(children: React.ReactNode, client = createTestQueryClient()) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
