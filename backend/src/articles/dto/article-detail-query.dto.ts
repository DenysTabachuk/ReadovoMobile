import { IsIn } from 'class-validator';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { TrimToLowerCase } from '../../common/validation/transforms';

const requestSchema = {
  name: 'ArticleDetailQuery',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class ArticleDetailQueryDto {
  @ApiPropertyOptional({
    enum: ['en'],
    default: 'en',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(['en'])
  @TrimToLowerCase()
  languageCode = 'en';
}
