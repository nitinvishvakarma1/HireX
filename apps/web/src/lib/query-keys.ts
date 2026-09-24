/**
 * Centralized React Query keys so caches invalidate consistently and we avoid
 * stringly-typed duplication across hooks (ENGINEERING_GUIDELINES §2, §3).
 */
export const queryKeys = {
  matches: {
    all: ["matches"] as const,
    list: () => [...queryKeys.matches.all, "list"] as const,
  },
  applications: {
    all: ["applications"] as const,
    list: () => [...queryKeys.applications.all, "list"] as const,
  },
} as const;
