import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

const MAX_QUIZ_IDENTIFIER_LENGTH = 200;
const MIN_SELECTED_OPTIONS = 1;
const MAX_SELECTED_OPTIONS = 20;
const requestSchema = {
  name: 'SubmitQuizAnswerRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class SubmitQuizAnswerDto {
  @ApiProperty({
    type: String,
    maxLength: MAX_QUIZ_IDENTIFIER_LENGTH,
    description:
      'Question ID from the saved quiz. Not trimmed; membership is checked by the service.',
  })
  @IsString()
  @MaxLength(MAX_QUIZ_IDENTIFIER_LENGTH)
  declare questionId: string;

  @ApiProperty({
    type: 'array',
    minItems: MIN_SELECTED_OPTIONS,
    maxItems: MAX_SELECTED_OPTIONS,
    uniqueItems: true,
    items: { type: 'string', maxLength: MAX_QUIZ_IDENTIFIER_LENGTH },
  })
  @IsArray()
  @ArrayMinSize(MIN_SELECTED_OPTIONS)
  @ArrayMaxSize(MAX_SELECTED_OPTIONS)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(MAX_QUIZ_IDENTIFIER_LENGTH, { each: true })
  declare selectedOptionIds: string[];
}
