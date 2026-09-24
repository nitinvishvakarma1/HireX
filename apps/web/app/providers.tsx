"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * React Query provider (ENGINEERING_GUIDELINES §11 "server state via a data
 * layer with loading/error handling built in").
 *
 * The client is created lazily in state so each browser session gets one stable
 * instance and it is never shared across requests on the server.
 */
export function Providers({ children }: { children: ReactNode }): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Sensible, non-magic defaults; tune per-hook where needed.
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
