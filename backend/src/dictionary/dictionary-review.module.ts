import { Module } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { DictionaryReviewService } from './dictionary-review.service';

@Module({
  imports: [AchievementsModule],
  providers: [DictionaryReviewService],
  exports: [DictionaryReviewService],
})
export class DictionaryReviewModule {}
