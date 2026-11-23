import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyExerciseKind } from '../../../generated/prisma/enums';
import { VocabularyPracticeOptionDto } from './vocabulary-practice-option.dto';

@ApiSchema({ name: 'VocabularyPracticeQuestion' })
export class VocabularyPracticeQuestionDto {
  @ApiProperty({ type: String })
  declare id: string;

  @ApiProperty({
    enum: VocabularyExerciseKind,
    enumName: 'VocabularyExerciseKind',
  })
  declare kind: VocabularyExerciseKind;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'English prompt for word/picture or device speech; null for a sentence gap. No answer identifier.',
  })
  declare prompt: string | null;

  @ApiProperty({ type: String, nullable: true })
  declare sentenceBefore: string | null;

  @ApiProperty({ type: String, nullable: true })
  declare sentenceAfter: string | null;

  @ApiProperty({ type: [VocabularyPracticeOptionDto], minItems: 2 })
  declare options: VocabularyPracticeOptionDto[];
}
