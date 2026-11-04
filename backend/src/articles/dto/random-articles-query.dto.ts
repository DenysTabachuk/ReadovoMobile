import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ToNumber } from '../../common/validation/transforms';
import { MAX_ARTICLE_LIMIT } from '../discovery/article-catalog';

const requestSchema = {
  name: 'RandomArticlesQuery',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class RandomArticlesQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: MAX_ARTICLE_LIMIT,
    description: 'Optional integer; omission uses the service default of 20.',
  })
  @IsInt()
  @IsOptional()
  @Max(MAX_ARTICLE_LIMIT)
  @Min(1)
  @ToNumber()
  limit?: number;
}
