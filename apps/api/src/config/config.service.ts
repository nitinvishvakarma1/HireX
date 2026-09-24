import { Inject, Injectable } from '@nestjs/common';

import { AppConfig } from './configuration';

/** DI token for the validated, immutable {@link AppConfig}. */
export const APP_CONFIG = Symbol('APP_CONFIG');

/**
 * Typed accessor for validated configuration. Inject this instead of reading
 * `process.env` directly anywhere in the codebase (Rulebook §4).
 */
@Injectable()
export class AppConfigService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get nodeEnv(): AppConfig['nodeEnv'] {
    return this.config.nodeEnv;
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  get port(): number {
    return this.config.port;
  }

  get logLevel(): AppConfig['logLevel'] {
    return this.config.logLevel;
  }

  get database(): AppConfig['database'] {
    return this.config.database;
  }

  get redis(): AppConfig['redis'] {
    return this.config.redis;
  }

  get storage(): AppConfig['storage'] {
    return this.config.storage;
  }

  get anthropic(): AppConfig['anthropic'] {
    return this.config.anthropic;
  }
}
