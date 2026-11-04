import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { TrimToLowerCase } from '../../common/validation/transforms';
import { AUTH_EMAIL_MAX_LENGTH } from '../constants';

const requestSchema = { name: 'AuthEmailRequest', additionalProperties: false };

// The resend operation already reuses this exact DTO and its validation.
@ApiSchema(requestSchema)
export class RequestPasswordResetDto {
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
