import { ARTICLE_ADAPTATION_IDS_MAX_COUNT } from '../contracts/constants';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  ToUniquePositiveIntegerArray,
  TrimToLowerCase,
} from '../../common/validation/transforms';
import { type ArticleTextTransformationType } from '../contracts/types';
import { TRANSFORMATION_TYPES } from '../contracts/constants';

const requestSchema = {
  name: 'ArticleAdaptationsQuery',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class ArticleAdaptationsQueryDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'integer', minimum: 1 },
    maxItems: ARTICLE_ADAPTATION_IDS_MAX_COUNT,
    minItems: 1,
    description:
      'Comma-separated positive integers, deduplicated before validation. Empty input is omitted; repeated string query values fail validation.',
  })
  @ArrayMaxSize(ARTICLE_ADAPTATION_IDS_MAX_COUNT)
  @ArrayNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ToUniquePositiveIntegerArray()
  declare articleIds: number[];

  @ApiPropertyOptional({
    enum: ['all', ...TRANSFORMATION_TYPES],
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(['all', ...TRANSFORMATION_TYPES])
  @IsOptional()
  @TrimToLowerCase()
  transformationType?: ArticleTextTransformationType | 'all';
}
