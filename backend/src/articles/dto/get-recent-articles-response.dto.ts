import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { WikipediaArticleResponseDto } from './wikipedia-article-response.dto';

@ApiSchema({ name: 'UserRecentArticle' })
export class UserRecentArticleResponseDto extends WikipediaArticleResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  declare openedAt: string;
}
