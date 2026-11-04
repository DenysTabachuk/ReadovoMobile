import { DICTIONARY_TEST_QUESTION_FORMATS } from '../constants';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { type DictionaryTestQuestionFormat } from '../types';

@ApiSchema({ name: 'DictionaryTestQuestionOption' })
export class DictionaryTestQuestionOptionDto {
  @ApiProperty({ type: String })
  declare id: string;

  @ApiProperty({ type: String })
  declare text: string;

  @ApiProperty({ type: String })
  declare translation: string;
}
@ApiSchema({ name: 'DictionaryTestQuestion' })
export class DictionaryTestQuestionDto {
  @ApiProperty({
    enum: DICTIONARY_TEST_QUESTION_FORMATS,
    enumName: 'DictionaryTestQuestionFormat',
  })
  declare format: DictionaryTestQuestionFormat;

  @ApiProperty({ type: [DictionaryTestQuestionOptionDto] })
  declare options: DictionaryTestQuestionOptionDto[];

  @ApiProperty({ type: String })
  declare prompt: string;

  @ApiProperty({ type: String })
  declare word: string;

  @ApiProperty({ type: String })
  declare wordId: string;
}
@ApiSchema({ name: 'DictionaryTest' })
export class GetDictionaryTestResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  declare sessionId: string;

  @ApiProperty({ type: [DictionaryTestQuestionDto] })
  declare questions: DictionaryTestQuestionDto[];
}
