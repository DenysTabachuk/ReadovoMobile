import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ArticleAdaptationSummaryResponseDto } from './article-adaptation-summary-response.dto';

@ApiSchema({ name: 'WikipediaArticle' })
export class WikipediaArticleResponseDto {
  @ApiPropertyOptional({ type: [ArticleAdaptationSummaryResponseDto] })
  declare availableAdaptations?: ArticleAdaptationSummaryResponseDto[];
  @ApiProperty({ type: 'string' })
  declare extract: string;
  @ApiProperty({ type: 'integer' })
  declare id: number;
  @ApiPropertyOptional({ type: 'integer' })
  declare pageLength?: number;
  @ApiPropertyOptional({ type: 'string' })
  declare thumbnailUrl?: string;
  @ApiProperty({ type: 'string' })
  declare title: string;
  @ApiProperty({ type: 'string' })
  declare url: string;
}
