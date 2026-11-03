import { type Type } from '@nestjs/common';

import { TranslationsModule } from '../translations/translations.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { MascotModule } from '../mascot/mascot.module';
import { StreakModule } from '../streak/streak.module';
import { QuizModule } from '../quiz/quiz.module';
import { NotificationsModule } from '../notifications/notifications.module';

// One coverage list for the production Swagger UI and the offline exporter.
// Review import-time side effects and rerun isolation tests before adding modules.
export const DOCUMENTED_API_MODULES = [
  TranslationsModule,
  AchievementsModule,
  MascotModule,
  StreakModule,
  QuizModule,
  NotificationsModule,
] satisfies Type[];
