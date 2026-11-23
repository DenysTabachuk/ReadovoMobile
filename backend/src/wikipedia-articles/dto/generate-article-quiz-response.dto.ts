import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ArticleQuizQuestionDto } from './article-quiz-question.dto';

@ApiSchema({ name: 'GenerateArticleQuizResponse' })
export class GenerateArticleQuizResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  declare sessionId: string;
  @ApiProperty({ type: [ArticleQuizQuestionDto] })
  declare questions: ArticleQuizQuestionDto[];
}
