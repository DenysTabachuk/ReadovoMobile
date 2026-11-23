import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LearningCatalogueService } from './catalogue/learning-catalogue.service';
import { LearningLessonService } from './lessons/learning-lesson.service';
import { LearningReadingService } from './reading/learning-reading.service';
import { VocabularyPracticeService } from './vocabulary/vocabulary-practice.service';
import { LearningController } from './learning.controller';
import { LearningMediaController } from './media/learning-media.controller';
import { LearningMediaService } from './media/learning-media.service';

@Module({
  imports: [AuthModule],
  controllers: [LearningController, LearningMediaController],
  providers: [
    LearningCatalogueService,
    LearningLessonService,
    LearningReadingService,
    LearningMediaService,
    VocabularyPracticeService,
  ],
})
export class LearningModule {}
