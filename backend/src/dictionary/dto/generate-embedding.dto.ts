import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Trim } from '../../common/validation/transforms';

const EMBEDDING_TEXT_MAX_LENGTH = 4000;

const requestSchema = {
  name: 'GenerateDictionaryEmbeddingRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class GenerateEmbeddingDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: EMBEDDING_TEXT_MAX_LENGTH,
    description: 'Trimmed embedding text.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(EMBEDDING_TEXT_MAX_LENGTH)
  @Trim()
  declare text: string;
}
