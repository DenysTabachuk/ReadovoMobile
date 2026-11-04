import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { Trim } from '../../common/validation/transforms';
import { MASCOT_ACCESSORY_SLOTS } from '../constants';
import { type MascotAccessorySlot } from '../types';

export class ClearMascotSlotParamsDto {
  @ApiProperty({
    enum: MASCOT_ACCESSORY_SLOTS,
    enumName: 'MascotAccessorySlot',
    description: 'Accessory slot. Trimmed before validation.',
  })
  @IsIn(MASCOT_ACCESSORY_SLOTS)
  @Trim()
  declare slot: MascotAccessorySlot;
}
