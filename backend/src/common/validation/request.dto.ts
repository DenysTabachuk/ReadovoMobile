import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

import { Trim } from './transforms';

export class UserIdParamsDto {
  @IsUUID()
  @Trim()
  userId!: string;
}

export class UserAndItemIdParamsDto extends UserIdParamsDto {
  @IsNotEmpty()
  @Trim()
  itemId!: string;
}

export class UserAndWordIdParamsDto extends UserIdParamsDto {
  @IsUUID()
  @Trim()
  wordId!: string;
}

export class ClearMascotSlotParamsDtoBase extends UserIdParamsDto {
  @IsIn(['eyes', 'head'])
  @Trim()
  slot!: 'eyes' | 'head';
}
