import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../common/validation/transforms';

export class DictionaryWordParamsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Trimmed dictionary word ID.',
  })
  @IsUUID()
  @Trim()
  declare wordId: string;
}
