import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { VocabularyLevel } from '../../../generated/prisma/enums';
import { LearningEntryDto } from '../../dto/learning-entry.dto';

@ApiSchema({ name: 'GetLearningCatalogueResponse' })
@ApiExtraModels(LearningEntryDto)
export class GetLearningCatalogueResponseDto {
  @ApiProperty({
    enum: VocabularyLevel,
    enumName: 'VocabularyLevel',
    isArray: true,
  })
  declare supportedLevels: VocabularyLevel[];
  @ApiProperty({ enum: VocabularyLevel, enumName: 'VocabularyLevel' })
  declare defaultLevel: VocabularyLevel;
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(LearningEntryDto) },
      { type: 'object', nullable: true, enum: [null] },
    ],
  })
  declare topic: LearningEntryDto | null;
  @ApiProperty({ type: [LearningEntryDto] })
  declare topics: LearningEntryDto[];
  @ApiProperty({ type: [LearningEntryDto] })
  declare lessons: LearningEntryDto[];
}
