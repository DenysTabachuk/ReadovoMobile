import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ArticleVocabularyQuizQuestionDto } from './article-quiz-question.dto';
import { SIMPLIFICATION_LEVELS } from '../contracts/constants';
import { type ArticleSimplificationLevel } from '../contracts/types';

@ApiSchema({ name: 'GenerateArticleVocabularyQuizResponse' })
export class GenerateArticleVocabularyQuizResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  declare sessionId: string;
  @ApiProperty({ type: [ArticleVocabularyQuizQuestionDto] })
  declare questions: ArticleVocabularyQuizQuestionDto[];
  @ApiProperty({
    enum: SIMPLIFICATION_LEVELS,
    enumName: 'ArticleSimplificationLevel',
  })
  declare resolvedLevel: ArticleSimplificationLevel;
}
