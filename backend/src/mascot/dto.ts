import { IsIn, IsNotEmpty } from 'class-validator';

import { UserIdParamsDto } from '../common/validation/request.dto';
import { Trim } from '../common/validation/transforms';
import { type MascotAccessorySlot } from './types';

export class MascotItemParamsDto extends UserIdParamsDto {
  @IsNotEmpty()
  @Trim()
  itemId!: string;
}

export class ClearMascotSlotParamsDto extends UserIdParamsDto {
  @IsIn(['eyes', 'head'])
  @Trim()
  slot!: MascotAccessorySlot;
}
