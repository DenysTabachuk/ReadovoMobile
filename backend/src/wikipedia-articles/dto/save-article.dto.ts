import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArticleAdaptationSummaryDto } from './article-adaptation-summary.dto';
import { Trim } from '../../common/validation/transforms';
import { ARTICLE_TITLE_MAX_LENGTH } from '../contracts/constants';

const requestSchema = {
  name: 'SaveArticleRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class WikipediaArticleDto {
  @ApiPropertyOptional({ type: [ArticleAdaptationSummaryDto], nullable: true })
  @IsArray()
  @IsOptional()
  @Type(() => ArticleAdaptationSummaryDto)
  @ValidateNested({ each: true })
  availableAdaptations?: ArticleAdaptationSummaryDto[];

  @ApiProperty({ type: 'string' })
  @IsString()
  declare extract: string;

  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  declare id: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 0, nullable: true })
  @IsInt()
  @IsOptional()
  @Min(0)
  pageLength?: number;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  thumbnailUrl?: string;

  @ApiProperty({
    type: 'string',
    maxLength: ARTICLE_TITLE_MAX_LENGTH,
    minLength: 1,
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(ARTICLE_TITLE_MAX_LENGTH)
  @Trim()
  declare title: string;

  @ApiProperty({ type: 'string' })
  @IsUrl({ require_protocol: true })
  declare url: string;
}
