import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LearningCatalogueService } from './catalogue/learning-catalogue.service';
import { LearningLessonService } from './lessons/learning-lesson.service';
import { LearningReadingService } from './reading/learning-reading.service';
import { VocabularyPracticeService } from './vocabulary/vocabulary-practice.service';
import { LearningController } from './learning.controller';

@Module({
  imports: [AuthModule],
  controllers: [LearningController],
  providers: [
    LearningCatalogueService,
    LearningLessonService,
    LearningReadingService,
    VocabularyPracticeService,
  ],
})
export class LearningModule {}
