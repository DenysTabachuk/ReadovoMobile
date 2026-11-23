import { IsInt, Min } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ToNumber } from '../../common/validation/transforms';

const requestSchema = { name: 'ArticleIdParams', additionalProperties: false };

@ApiSchema(requestSchema)
export class ArticleIdParamsDto {
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  @ToNumber()
  declare id: number;
}
