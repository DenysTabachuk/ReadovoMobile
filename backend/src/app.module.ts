import { type DynamicModule, Module } from '@nestjs/common';

import { AchievementsModule } from './achievements/achievements.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { MascotModule } from './mascot/mascot.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsDiagnosticsModule } from './notifications/diagnostics/notifications-diagnostics.module';
import { PrismaModule } from './prisma/prisma.module';
import { StreakModule } from './streak/streak.module';
import { TranslationsModule } from './translations/translations.module';

@Module({
  imports: [
    PrismaModule,
    AchievementsModule,
    AuthModule,
    ArticlesModule,
    TranslationsModule,
    DictionaryModule,
    MascotModule,
    NotificationsModule,
    StreakModule,
  ],
})
export class AppModule {
  /**
   * Selects optional development controllers after startup environment loading.
   * @param environment - Explicit NODE_ENV value; unset means local development.
   * @returns The real app root with diagnostics only for development/unset values.
   * Production, test and unknown environments omit diagnostics entirely. No secret
   * or environment file is read here; the caller supplies the already-loaded value.
   * @example
   * AppModule.forEnvironment('production'); // => root without diagnostic routes
   */
  static forEnvironment(environment: string | undefined): DynamicModule {
    const diagnosticsEnabled =
      environment === undefined || environment === 'development';
    return {
      module: AppModule,
      imports: diagnosticsEnabled ? [NotificationsDiagnosticsModule] : [],
    };
  }
}
