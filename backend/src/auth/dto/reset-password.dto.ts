import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MatchesProperty } from '../../common/validation/match.decorator';
import { Trim, TrimToLowerCase } from '../../common/validation/transforms';

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(254)
  @TrimToLowerCase()
  email!: string;

  @IsString()
  @MaxLength(128)
  @MinLength(8)
  password!: string;

  @IsString()
  @MatchesProperty<ResetPasswordDto>('password')
  passwordConfirmation!: string;

  @Matches(/^[a-f\d]{64}$/i)
  @Trim()
  resetToken!: string;
}
