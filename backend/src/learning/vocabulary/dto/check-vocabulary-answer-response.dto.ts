import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLessonWordDto } from './vocabulary-lesson-word.dto';

@ApiSchema({ name: 'CheckVocabularyAnswerResponse' })
export class CheckVocabularyAnswerResponseDto {
  @ApiProperty({ type: String })
  declare questionId: string;

  @ApiProperty({ type: String })
  declare selectedOptionId: string;

  @ApiProperty({ type: String })
  declare correctOptionId: string;

  @ApiProperty({ type: Boolean })
  declare isCorrect: boolean;

  @ApiProperty({ type: VocabularyLessonWordDto })
  declare word: VocabularyLessonWordDto;

  @ApiProperty({ type: String, nullable: true })
  declare sentenceTranslationUk: string | null;
}
