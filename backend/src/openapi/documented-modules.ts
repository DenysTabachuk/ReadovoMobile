import { type Type } from '@nestjs/common';

import { TranslationsModule } from '../translations/translations.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { MascotModule } from '../mascot/mascot.module';
import { StreakModule } from '../streak/streak.module';
import { QuizModule } from '../quiz/quiz.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsDiagnosticsModule } from '../notifications/diagnostics/notifications-diagnostics.module';
import { DictionaryModule } from '../dictionary/dictionary.module';
import { AuthModule } from '../auth/auth.module';

// Canonical coverage includes development contracts for frontend type generation.
// Runtime Swagger scans only modules actually registered in its application.
// Review import-time side effects and rerun isolation tests before adding modules.
export const DOCUMENTED_API_MODULES = [
  TranslationsModule,
  AchievementsModule,
  MascotModule,
  StreakModule,
  QuizModule,
  NotificationsModule,
  NotificationsDiagnosticsModule,
  AuthModule,
  DictionaryModule,
] satisfies Type[];
