import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { queryKeys } from "@/src/lib/query-keys";
import { MOCK_MATCHES } from "@/src/mocks/fixtures";
import type { Match } from "@/src/types/domain";

/** Simulated network latency so loading states are exercised in development. */
const MOCK_LATENCY_MS = 600;

/**
 * Fetches ranked job matches.
 *
 * TODO(api): Swap the mock body for a real call once the endpoint exists:
 *   const { items } = await apiClient.get<Paginated<Match>>("/matches", { signal });
 *   return items;
 * The hook's public contract (returns `Match[]`) stays the same, so callers and
 * the UI do not change.
 */
async function fetchMatches(signal?: AbortSignal): Promise<Match[]> {
  return new Promise<Match[]>((resolve, reject) => {
    const timer = setTimeout(() => resolve(MOCK_MATCHES), MOCK_LATENCY_MS);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export function useMatches(): UseQueryResult<Match[], Error> {
  return useQuery({
    queryKey: queryKeys.matches.list(),
    queryFn: ({ signal }) => fetchMatches(signal),
  });
}
