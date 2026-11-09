import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLessonSummaryDto } from './vocabulary-lesson-summary.dto';
import { VocabularyLessonWordDto } from './vocabulary-lesson-word.dto';
import { VocabularyLessonStageDto } from './vocabulary-lesson-stage.dto';

@ApiSchema({ name: 'GetVocabularyLessonResponse' })
export class GetVocabularyLessonResponseDto extends VocabularyLessonSummaryDto {
  @ApiProperty({ type: [VocabularyLessonWordDto] })
  declare words: VocabularyLessonWordDto[];

  @ApiProperty({ type: [VocabularyLessonStageDto] })
  declare stages: VocabularyLessonStageDto[];
}
