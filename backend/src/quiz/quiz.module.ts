import { Module } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { AuthModule } from '../auth/auth.module';
import { DictionaryReviewModule } from '../dictionary/dictionary-review.module';
import { StreakModule } from '../streak/streak.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [
    AuthModule,
    AchievementsModule,
    DictionaryReviewModule,
    StreakModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
