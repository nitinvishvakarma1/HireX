import { getClientConfig } from "@/src/lib/config";

/**
 * Typed HTTP client for the HireX API (ENGINEERING_GUIDELINES §4, §5).
 *
 * - Base URL comes from validated config — never hard-coded.
 * - Every request has a timeout; failures are translated into a typed
 *   {@link ApiError} with a friendly, non-leaky message rather than a raw
 *   fetch rejection.
 * - No secrets are logged; internals are not surfaced to the UI.
 */

/** Default per-request timeout. Sourced from a constant, not inlined magically. */
const DEFAULT_TIMEOUT_MS = 15_000;

export interface ApiRequestOptions {
  /** Query-string parameters; `undefined` values are skipped. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** Domain-specific error mapped from a failed API call. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: ApiRequestOptions["query"],
): string {
  const url = new URL(path.replace(/^\//, ""), `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Performs a typed GET request and parses the JSON body as `TResponse`.
 * Callers own runtime validation of the shape (e.g. with a Zod schema) at the
 * boundary; this keeps transport concerns separate from domain concerns.
 */
async function get<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { apiBaseUrl } = getClientConfig();
  const { query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(buildUrl(apiBaseUrl, path, query), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(
        `Request to ${path} failed with status ${response.status}.`,
        response.status,
      );
    }

    return (await response.json()) as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(`Request to ${path} timed out. Please try again.`);
    }
    // Translate any other transport failure into a friendly, non-leaky message.
    throw new ApiError(
      `We couldn't reach the HireX service. Please check your connection and try again.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = { get };
