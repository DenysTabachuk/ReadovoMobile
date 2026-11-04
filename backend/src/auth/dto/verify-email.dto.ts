import { IsEmail, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { Trim, TrimToLowerCase } from '../../common/validation/transforms';
import {
  AUTH_EMAIL_MAX_LENGTH,
  AUTH_VERIFICATION_CODE_PATTERN,
} from '../constants';

const requestSchema = {
  name: 'VerifyAuthCodeRequest',
  additionalProperties: false,
};

// Email verification and password-reset verification share these input fields.
@ApiSchema(requestSchema)
export class VerifyEmailDto {
  @ApiProperty({
    type: String,
    pattern: AUTH_VERIFICATION_CODE_PATTERN.source,
    writeOnly: true,
    description: 'Six-digit code, trimmed before validation.',
  })
  @Matches(AUTH_VERIFICATION_CODE_PATTERN)
  @Trim()
  declare code: string;

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
}
