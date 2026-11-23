import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { VocabularyLevel } from '../../../generated/prisma/enums';
import { LearningEntryDto } from '../../dto/learning-entry.dto';
import { LearningVariantDto } from './learning-variant.dto';

@ApiSchema({ name: 'GetLearningLessonResponse' })
@ApiExtraModels(LearningVariantDto)
export class GetLearningLessonResponseDto extends LearningEntryDto {
  @ApiProperty({ type: String })
  declare topicSlug: string;
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
