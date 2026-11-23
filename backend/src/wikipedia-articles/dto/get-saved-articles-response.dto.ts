import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { WikipediaArticleResponseDto } from './wikipedia-article-response.dto';

@ApiSchema({ name: 'UserSavedArticle' })
export class UserSavedArticleResponseDto extends WikipediaArticleResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  declare savedAt: string;
}
