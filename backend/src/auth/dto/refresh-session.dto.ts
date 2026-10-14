import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { Trim } from '../../common/validation/transforms';

export class RefreshSessionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  @Trim()
  refreshToken!: string;
}
