import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { Trim } from '../../common/validation/transforms';

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(8192)
  @Trim()
  idToken!: string;
}
