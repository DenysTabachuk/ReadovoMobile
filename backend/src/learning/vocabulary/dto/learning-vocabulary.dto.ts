import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLessonWordDto } from './vocabulary-lesson-word.dto';
import { VocabularyPracticeQuestionDto } from './vocabulary-practice-question.dto';

@ApiSchema({ name: 'LearningVocabulary' })
export class LearningVocabularyDto {
  @ApiProperty({ type: [VocabularyLessonWordDto] })
  declare words: VocabularyLessonWordDto[];

  @ApiProperty({ type: [VocabularyPracticeQuestionDto] })
  declare questions: VocabularyPracticeQuestionDto[];
}
