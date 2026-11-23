import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  SIMPLIFICATION_LEVELS,
  TRANSFORMATION_TYPES,
} from '../contracts/constants';
import {
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
} from '../contracts/types';

@ApiSchema({ name: 'ArticleAdaptationSummary' })
export class ArticleAdaptationSummaryResponseDto {
  @ApiProperty({
    enum: SIMPLIFICATION_LEVELS,
    enumName: 'ArticleSimplificationLevel',
  })
  declare level: ArticleSimplificationLevel;
  @ApiProperty({
    enum: TRANSFORMATION_TYPES,
    enumName: 'ArticleTextTransformationType',
  })
  declare transformationType: ArticleTextTransformationType;
}
