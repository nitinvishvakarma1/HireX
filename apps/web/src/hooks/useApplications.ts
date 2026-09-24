import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { queryKeys } from "@/src/lib/query-keys";
import { MOCK_APPLICATIONS } from "@/src/mocks/fixtures";
import type { Application } from "@/src/types/domain";

/** Simulated network latency so loading states are exercised in development. */
const MOCK_LATENCY_MS = 600;

/**
 * Fetches the candidate's tracked applications.
 *
 * TODO(api): Swap the mock body for a real call once the endpoint exists:
 *   const { items } = await apiClient.get<Paginated<Application>>("/applications", { signal });
 *   return items;
 * The hook's public contract (returns `Application[]`) stays the same.
 */
async function fetchApplications(signal?: AbortSignal): Promise<Application[]> {
  return new Promise<Application[]>((resolve, reject) => {
    const timer = setTimeout(() => resolve(MOCK_APPLICATIONS), MOCK_LATENCY_MS);
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

export function useApplications(): UseQueryResult<Application[], Error> {
  return useQuery({
    queryKey: queryKeys.applications.list(),
    queryFn: ({ signal }) => fetchApplications(signal),
  });
}
