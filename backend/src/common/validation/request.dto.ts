import { IsUUID } from 'class-validator';

import { Trim } from './transforms';

export class UserIdParamsDto {
  @IsUUID()
  @Trim()
  userId!: string;
}

export class UserAndWordIdParamsDto extends UserIdParamsDto {
  @IsUUID()
  @Trim()
  wordId!: string;
}
