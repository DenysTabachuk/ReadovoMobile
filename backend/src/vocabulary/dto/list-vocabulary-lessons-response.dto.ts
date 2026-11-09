import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLessonSummaryDto } from './vocabulary-lesson-summary.dto';

@ApiSchema({ name: 'ListVocabularyLessonsResponse' })
export class ListVocabularyLessonsResponseDto {
  @ApiProperty({ type: [VocabularyLessonSummaryDto] })
  declare lessons: VocabularyLessonSummaryDto[];
}
