import { IsEmail, Matches, MaxLength } from 'class-validator';

import { Trim, TrimToLowerCase } from '../../common/validation/transforms';

export class VerifyEmailDto {
  @Matches(/^\d{6}$/)
  @Trim()
  code!: string;

  @IsEmail()
  @MaxLength(254)
  @TrimToLowerCase()
  email!: string;
}
