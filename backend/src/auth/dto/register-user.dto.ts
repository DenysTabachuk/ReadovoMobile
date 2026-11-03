import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { MatchesProperty } from '../../common/validation/match.decorator';
import { TrimToLowerCase } from '../../common/validation/transforms';
import {
  AUTH_EMAIL_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
} from '../constants';

const requestSchema = {
  name: 'RegisterUserRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class RegisterUserDto {
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
    minLength: AUTH_PASSWORD_MIN_LENGTH,
    maxLength: AUTH_PASSWORD_MAX_LENGTH,
    writeOnly: true,
    description: 'Password is not trimmed.',
  })
  @IsString()
  @MaxLength(AUTH_PASSWORD_MAX_LENGTH)
  @MinLength(AUTH_PASSWORD_MIN_LENGTH)
  declare password: string;

  @ApiProperty({
    type: String,
    writeOnly: true,
    description:
      'Must exactly match password; equality is enforced by class-validator.',
  })
  @IsString()
  @MatchesProperty<RegisterUserDto>('password')
  declare passwordConfirmation: string;
}
