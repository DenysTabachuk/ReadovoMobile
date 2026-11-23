import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  OmitType,
} from '@nestjs/swagger';
import {
  ARTICLE_QUESTION_TYPES,
  VOCABULARY_QUESTION_FORMATS,
  VOCABULARY_TERM_KINDS,
} from '../contracts/constants';
import {
  type ArticleQuizQuestionType,
  type ArticleQuizQuestion,
  type ArticleQuizQuestionOption,
  type ArticleVocabularyQuizQuestionFormat,
  type ArticleVocabularyQuizTermKind,
} from '../contracts/types';

@ApiSchema({ name: 'ArticleQuizQuestionOption' })
export class ArticleQuizQuestionOptionDto implements ArticleQuizQuestionOption {
  @ApiProperty({ type: 'string' })
  declare id: string;
  @ApiProperty({ type: 'string' })
  declare text: string;
}

@ApiSchema({ name: 'ArticleQuizQuestion' })
export class ArticleQuizQuestionDto {
  @ApiProperty({ type: 'string' })
  declare id: string;
  @ApiProperty({ type: [ArticleQuizQuestionOptionDto] })
  declare options: ArticleQuizQuestionOptionDto[];
  @ApiProperty({ type: 'string' })
  declare prompt: string;
  @ApiProperty({
    enum: ARTICLE_QUESTION_TYPES,
    enumName: 'ArticleQuizQuestionType',
  })
  declare type: ArticleQuizQuestionType;
}

@ApiSchema({ name: 'ArticleQuizAnswerKeyQuestion' })
export class ArticleQuizAnswerKeyQuestionDto
  extends ArticleQuizQuestionDto
  implements ArticleQuizQuestion
{
  @ApiProperty({ type: [String] })
  declare correctOptionIds: string[];
  @ApiPropertyOptional({ type: 'string' })
  declare explanation?: string;
}

@ApiSchema({ name: 'ArticleVocabularyQuizQuestion' })
export class ArticleVocabularyQuizQuestionDto extends OmitType(
  ArticleQuizQuestionDto,
  ['type'] as const,
) {
  @ApiProperty({ enum: ['single_choice'] })
  declare type: 'single_choice';
  @ApiProperty({
    enum: VOCABULARY_QUESTION_FORMATS,
    enumName: 'ArticleVocabularyQuizQuestionFormat',
  })
  declare format: ArticleVocabularyQuizQuestionFormat;
  @ApiProperty({
    enum: VOCABULARY_TERM_KINDS,
    enumName: 'ArticleVocabularyQuizTermKind',
  })
  declare termKind: ArticleVocabularyQuizTermKind;
}
