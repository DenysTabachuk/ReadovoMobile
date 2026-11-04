import { IsInt, Min } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ToNumber } from '../../common/validation/transforms';

const requestSchema = {
  name: 'SavedArticleIdParams',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class SavedArticleIdParamsDto {
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  @ToNumber()
  declare articleId: number;
}
