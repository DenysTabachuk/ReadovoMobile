import {
  getSchemaPath,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  SIMPLIFICATION_LEVELS,
  TRANSFORMATION_TYPES,
} from '../contracts/constants';
import {
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
  type ArticleBlock,
  type ArticleQuizQuestion,
} from '../contracts/types';
import { ArticleBlockDto } from './article-block.dto';
import { ArticleQuizAnswerKeyQuestionDto } from './article-quiz-question.dto';

@ApiExtraModels(ArticleBlockDto)
@ApiSchema({ name: 'SimplifyArticleResponse' })
export class SimplifyArticleResponseDto {
  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(ArticleBlockDto) },
  })
  declare adaptedBlocks: ArticleBlock[];
  @ApiProperty({ type: 'integer' })
  declare adaptedLength: number;
  @ApiProperty({ type: 'integer' })
  declare originalLength: number;
  @ApiProperty({
    enum: SIMPLIFICATION_LEVELS,
    enumName: 'ArticleSimplificationLevel',
  })
  declare level: ArticleSimplificationLevel;
  @ApiPropertyOptional({ type: [ArticleQuizAnswerKeyQuestionDto] })
  declare questions?: ArticleQuizQuestion[];
  @ApiProperty({
    enum: TRANSFORMATION_TYPES,
    enumName: 'ArticleTextTransformationType',
  })
  declare transformationType: ArticleTextTransformationType;
  @ApiProperty({ type: 'string' })
  declare title: string;
}
