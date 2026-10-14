import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

import { MatchesProperty } from '../../common/validation/match.decorator';
import { TrimToLowerCase } from '../../common/validation/transforms';

export class RegisterUserDto {
  @IsEmail()
  @MaxLength(254)
  @TrimToLowerCase()
  email!: string;

  @IsString()
  @MaxLength(128)
  @MinLength(8)
  password!: string;

  @IsString()
  @MatchesProperty<RegisterUserDto>('password')
  passwordConfirmation!: string;
}
