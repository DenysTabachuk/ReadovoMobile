import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { VocabularyLevel } from '../../../generated/prisma/enums';
import { LearningEntryDto } from '../../dto/learning-entry.dto';
import { LEARNING_MEDIA_URL_PATTERN } from '../../media/constants';
import { LearningVariantDto } from './learning-variant.dto';

@ApiSchema({ name: 'GetLearningLessonResponse' })
@ApiExtraModels(LearningVariantDto)
export class GetLearningLessonResponseDto extends LearningEntryDto {
  @ApiProperty({ type: String })
  declare topicSlug: string;
  @ApiProperty({
    type: String,
    nullable: true,
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare readingImageUrl: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare readingCheckImageUrl: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare resultsImageUrl: string | null;
  @ApiProperty({
    enum: VocabularyLevel,
    enumName: 'VocabularyLevel',
    isArray: true,
  })
  declare supportedLevels: VocabularyLevel[];
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(LearningVariantDto) },
      { type: 'object', nullable: true, enum: [null] },
    ],
    description:
      'Null when this lesson has no published variant for the requested English level. No level fallback.',
  })
  declare variant: LearningVariantDto | null;
}
