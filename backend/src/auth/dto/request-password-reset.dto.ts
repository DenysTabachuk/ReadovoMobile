import { IsEmail, MaxLength } from 'class-validator';

import { TrimToLowerCase } from '../../common/validation/transforms';

export class RequestPasswordResetDto {
  @IsEmail()
  @MaxLength(254)
  @TrimToLowerCase()
  email!: string;
}
