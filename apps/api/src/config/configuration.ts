import { z } from 'zod';

/**
 * Single source of truth for environment-driven configuration.
 *
 * Rulebook §4: all config comes from the environment, is validated at startup
 * with Zod, and the process fails fast on missing/invalid values. There are no
 * hard-coded secrets or environment-specific values anywhere else in the code.
 *
 * New keys added here MUST also be added to the repo-root `.env.example`.
 */

const nodeEnvSchema = z
  .enum(['development', 'test', 'production'])
  .default('development');

const logLevelSchema = z
  .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  .default('info');

/**
 * Raw environment schema. Keys mirror `.env.example`.
 * `z.coerce` is used where env values arrive as strings.
 */
export const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  // PORT is optional; defaults to 3000. Add PORT to `.env.example` if overridden.
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: logLevelSchema,

  // Persistence
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Object storage (S3-compatible — Supabase Storage)
  STORAGE_S3_ENDPOINT: z.string().url(),
  STORAGE_S3_REGION: z.string().min(1),
  STORAGE_S3_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),

  // AI — owned by the Python worker, not the API. Optional here so the API can
  // boot without it; the worker validates its own required ANTHROPIC_API_KEY.
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Structured, typed configuration consumed by the app via `AppConfigService`. */
export interface AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly port: number;
  readonly logLevel: Env['LOG_LEVEL'];
  readonly database: {
    readonly url: string;
  };
  readonly redis: {
    readonly url: string;
  };
  readonly storage: {
    readonly endpoint: string;
    readonly region: string;
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly bucket: string;
  };
  readonly anthropic: {
    readonly apiKey?: string;
  };
}

/**
 * Parse and validate the environment into a structured {@link AppConfig}.
 * Throws a single, readable error listing every invalid/missing key so the
 * process fails fast at bootstrap. Secret VALUES are never included in the message.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration. Fix the following and see .env.example:\n${issues}`,
    );
  }

  const env = parsed.data;

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: { url: env.DATABASE_URL },
    redis: { url: env.REDIS_URL },
    storage: {
      endpoint: env.STORAGE_S3_ENDPOINT,
      region: env.STORAGE_S3_REGION,
      accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
      bucket: env.STORAGE_BUCKET,
    },
    anthropic: { apiKey: env.ANTHROPIC_API_KEY },
  };
}
