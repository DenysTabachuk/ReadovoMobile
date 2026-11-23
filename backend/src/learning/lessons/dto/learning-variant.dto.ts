import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLevel } from '../../../generated/prisma/enums';
import { LearningVocabularyDto } from '../../vocabulary/dto/learning-vocabulary.dto';
import { LearningReadingQuestionDto } from '../../reading/dto/learning-reading-question.dto';

@ApiSchema({ name: 'LearningVariant' })
export class LearningVariantDto {
  @ApiProperty({ enum: VocabularyLevel, enumName: 'VocabularyLevel' })
  declare level: VocabularyLevel;
  @ApiProperty({ type: () => LearningVocabularyDto })
  declare vocabulary: LearningVocabularyDto;
  @ApiProperty({ type: String })
  declare readingTitle: string;
  @ApiProperty({ type: [String], minItems: 1 })
  declare readingParagraphs: string[];
  @ApiProperty({ type: [LearningReadingQuestionDto], minItems: 1 })
  declare questions: LearningReadingQuestionDto[];
}
