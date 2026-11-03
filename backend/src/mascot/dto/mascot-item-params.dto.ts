import { IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../common/validation/transforms';

export class MascotItemParamsDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    description: 'Catalog item ID. Trimmed before validation.',
    example: 'pirate-hat',
  })
  @IsNotEmpty()
  @Trim()
  declare itemId: string;
}
