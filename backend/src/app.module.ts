import { Module } from '@nestjs/common';

import { AchievementsModule } from './achievements/achievements.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { MascotModule } from './mascot/mascot.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StreakModule } from './streak/streak.module';
import { TranslationsModule } from './translations/translations.module';

@Module({
  imports: [
    DatabaseModule,
    AchievementsModule,
    AuthModule,
    ArticlesModule,
    TranslationsModule,
    DictionaryModule,
    MascotModule,
    NotificationsModule,
    StreakModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
