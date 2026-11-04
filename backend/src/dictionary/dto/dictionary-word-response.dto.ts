import { DICTIONARY_WORD_PROGRESS } from '../constants';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { type DictionaryWordProgress } from '../types';

@ApiSchema({ name: 'DictionaryWord' })
export class DictionaryWordResponseDto {
  @ApiProperty({ type: String })
  declare context: string;

  @ApiProperty({ type: 'integer' })
  declare correctAnswersCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: string;

  @ApiProperty({ type: String })
  declare id: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  declare lastReviewedAt?: string;

  @ApiProperty({
    enum: DICTIONARY_WORD_PROGRESS,
    enumName: 'DictionaryWordProgress',
  })
  declare progress: DictionaryWordProgress;

  @ApiProperty({ type: 'integer' })
  declare requiredCorrectAnswers: number;

  @ApiProperty({ type: String })
  declare translation: string;

  @ApiProperty({ type: String })
  declare userId: string;

  @ApiProperty({ type: String })
  declare word: string;
}
