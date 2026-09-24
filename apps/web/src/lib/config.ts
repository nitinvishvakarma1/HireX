import { z } from "zod";

/**
 * Typed, validated client configuration (ENGINEERING_GUIDELINES §4).
 *
 * NO hard-coded URLs: every environment-specific value comes from the
 * environment and is validated here. Validation is memoized and fails fast with
 * a clear, actionable message the first time config is read, rather than letting
 * a malformed value cause confusing runtime failures deep in the data layer.
 *
 * Only `NEXT_PUBLIC_*` variables are referenced so values are correctly inlined
 * for the browser bundle by Next.js.
 */
const ClientConfigSchema = z.object({
  apiBaseUrl: z
    .string({ required_error: "NEXT_PUBLIC_API_URL is required" })
    .url("NEXT_PUBLIC_API_URL must be a valid absolute URL (e.g. http://localhost:4000)")
    // Normalize away a trailing slash so path joining is predictable.
    .transform((value) => value.replace(/\/+$/, "")),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

/** Raised when required configuration is missing or invalid. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

let cachedConfig: ClientConfig | null = null;

/**
 * Returns the validated client configuration, memoized after first access.
 * Throws {@link ConfigError} with a friendly message if the environment is
 * invalid — callers (e.g. the API client) surface this via the error UI.
 */
export function getClientConfig(): ClientConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = ClientConfigSchema.safeParse({
    // Must be a static property access so Next.js can inline it at build time.
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new ConfigError(
      `Invalid HireX web configuration: ${details}. ` +
        "Copy apps/web/.env.example to .env.local and set the required values.",
    );
  }

  cachedConfig = parsed.data;
  return cachedConfig;
}
