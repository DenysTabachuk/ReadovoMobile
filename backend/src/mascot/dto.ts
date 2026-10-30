import { IsIn, IsNotEmpty } from 'class-validator';

import { Trim } from '../common/validation/transforms';
import { type MascotAccessorySlot } from './types';

export class MascotItemParamsDto {
  @IsNotEmpty()
  @Trim()
  itemId!: string;
}

export class ClearMascotSlotParamsDto {
  @IsIn(['eyes', 'head'])
  @Trim()
  slot!: MascotAccessorySlot;
}
