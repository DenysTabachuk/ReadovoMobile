import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'QuizVocabularyWord' })
export class QuizVocabularyWordDto {
  @ApiProperty({ type: String })
  declare term: string;

  @ApiProperty({ type: String })
  declare translation: string;

  @ApiPropertyOptional({ type: String })
  sourceExcerpt?: string;
}

/** Answer-bearing feedback is returned only after a verified attempt is stored. */
@ApiSchema({ name: 'SubmitQuizAnswerResponse' })
export class SubmitQuizAnswerResponseDto {
  @ApiPropertyOptional({ type: QuizVocabularyWordDto })
  vocabularyWord?: QuizVocabularyWordDto;

  @ApiProperty({ type: [String] })
  declare newlyUnlockedAchievementIds: string[];

  @ApiProperty({ type: [String] })
  declare correctOptionIds: string[];

  @ApiPropertyOptional({ type: String })
  explanation?: string;

  @ApiProperty({ type: Boolean })
  declare isCorrect: boolean;
}
