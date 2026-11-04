import { IsInt, Max, Min } from 'class-validator';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ToNumber } from '../../common/validation/transforms';
import { DEFAULT_DICTIONARY_TEST_LIMIT } from '../constants';

const requestSchema = {
  name: 'DictionaryTestQuery',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class DictionaryTestQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: DEFAULT_DICTIONARY_TEST_LIMIT,
    default: DEFAULT_DICTIONARY_TEST_LIMIT,
    description: 'Coerced integer query value.',
  })
  @IsInt()
  @Max(DEFAULT_DICTIONARY_TEST_LIMIT)
  @Min(1)
  @ToNumber()
  limit = DEFAULT_DICTIONARY_TEST_LIMIT;
}
