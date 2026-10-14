import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { TrimToLowerCase } from '../../common/validation/transforms';

export class LoginUserDto {
  @IsEmail()
  @MaxLength(254)
  @TrimToLowerCase()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password!: string;
}
