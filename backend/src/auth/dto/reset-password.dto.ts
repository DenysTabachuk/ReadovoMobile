import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { MatchesProperty } from '../../common/validation/match.decorator';
import { Trim, TrimToLowerCase } from '../../common/validation/transforms';
import {
  AUTH_EMAIL_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_RESET_TOKEN_PATTERN,
} from '../constants';

const requestSchema = {
  name: 'ResetPasswordRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class ResetPasswordDto {
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
  @MatchesProperty<ResetPasswordDto>('password')
  declare passwordConfirmation: string;

  @ApiProperty({
    type: String,
    pattern: AUTH_RESET_TOKEN_PATTERN.source,
    writeOnly: true,
    description:
      'Reset credential returned after code verification. Trimmed before validation.',
  })
  @Matches(AUTH_RESET_TOKEN_PATTERN)
  @Trim()
  declare resetToken: string;
}
