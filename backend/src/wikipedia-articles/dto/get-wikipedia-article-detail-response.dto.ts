import {
  ApiExtraModels,
  getSchemaPath,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
} from '@nestjs/swagger';
import { type ArticleBlock } from '../contracts/types';
import { ArticleBlockDto } from './article-block.dto';

@ApiExtraModels(ArticleBlockDto)
@ApiSchema({ name: 'WikipediaArticleDetail' })
export class WikipediaArticleDetailResponseDto {
  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(ArticleBlockDto) },
  })
  declare blocks: ArticleBlock[];
  @ApiProperty({ type: 'string' })
  declare content: string;
  @ApiProperty({ type: 'string' })
  declare title: string;
  @ApiProperty({ type: 'string' })
  declare url: string;
  @ApiProperty({ type: 'integer' })
  declare id: number;
  @ApiPropertyOptional({ type: 'string' })
  declare thumbnailUrl?: string;
}
