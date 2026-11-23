import { IsIn } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
} from '../contracts/types';
import {
  SIMPLIFICATION_LEVELS,
  TRANSFORMATION_TYPES,
} from '../contracts/constants';

const requestSchema = {
  name: 'ArticleAdaptationSummaryInput',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class ArticleAdaptationSummaryDto {
  @ApiProperty({
    enum: SIMPLIFICATION_LEVELS,
    enumName: 'ArticleSimplificationLevel',
  })
  @IsIn(SIMPLIFICATION_LEVELS)
  declare level: ArticleSimplificationLevel;

  @ApiProperty({
    enum: TRANSFORMATION_TYPES,
    enumName: 'ArticleTextTransformationType',
  })
  @IsIn(TRANSFORMATION_TYPES)
  declare transformationType: ArticleTextTransformationType;
}
