import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { TrimToLowerCase } from '../../common/validation/transforms';
import { AUTH_EMAIL_MAX_LENGTH, AUTH_PASSWORD_MAX_LENGTH } from '../constants';

const requestSchema = { name: 'LoginUserRequest', additionalProperties: false };

@ApiSchema(requestSchema)
export class LoginUserDto {
  @ApiProperty({
    type: String,
    format: 'email',
    maxLength: AUTH_EMAIL_MAX_LENGTH,
    description: 'Trimmed and lowercased before validation.',
  })
  @IsEmail()
  @MaxLength(AUTH_EMAIL_MAX_LENGTH)
  @TrimToLowerCase()
  declare email: string;

  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: AUTH_PASSWORD_MAX_LENGTH,
    writeOnly: true,
    description: 'Password is not trimmed.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(AUTH_PASSWORD_MAX_LENGTH)
  declare password: string;
}
