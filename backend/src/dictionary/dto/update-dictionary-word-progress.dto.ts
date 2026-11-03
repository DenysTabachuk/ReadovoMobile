import { IsIn } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { type DictionaryWordProgress } from '../types';

const MANUAL_DICTIONARY_WORD_PROGRESS = ['in_progress'] as const;

const requestSchema = {
  name: 'UpdateDictionaryWordProgressRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class UpdateDictionaryWordProgressDto {
  @ApiProperty({
    enum: MANUAL_DICTIONARY_WORD_PROGRESS,
    description: 'Manual progress changes only mark a word in progress.',
  })
  @IsIn(MANUAL_DICTIONARY_WORD_PROGRESS)
  declare progress: Extract<DictionaryWordProgress, 'in_progress'>;
}
