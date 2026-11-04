import { ApiSchema, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { ArticleAdaptationSummaryResponseDto } from './article-adaptation-summary-response.dto';

const adaptationsSchema = {
  name: 'ArticleAdaptationsByArticleId',
  type: 'object',
  additionalProperties: {
    type: 'array',
    items: { $ref: getSchemaPath(ArticleAdaptationSummaryResponseDto) },
  },
};
@ApiExtraModels(ArticleAdaptationSummaryResponseDto)
@ApiSchema(adaptationsSchema)
export class ArticleAdaptationsResponseDto {}
