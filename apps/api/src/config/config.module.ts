import { DynamicModule, Global, Module } from '@nestjs/common';

import { AppConfigService, APP_CONFIG } from './config.service';
import { loadConfig } from './configuration';

/**
 * Global typed configuration module.
 *
 * `loadConfig()` runs during Nest initialization (via the factory below), after
 * `@nestjs/config` has loaded any `.env` file into `process.env`, and throws on
 * invalid config — so the app fails fast at startup (Rulebook §4).
 */
@Global()
@Module({})
export class AppConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: APP_CONFIG,
          useFactory: () => loadConfig(),
        },
        AppConfigService,
      ],
      exports: [AppConfigService, APP_CONFIG],
    };
  }
}
