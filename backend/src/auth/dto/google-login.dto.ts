import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { Trim } from '../../common/validation/transforms';

const ID_TOKEN_MAX_LENGTH = 8192;
const requestSchema = {
  name: 'GoogleLoginRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class GoogleLoginDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: ID_TOKEN_MAX_LENGTH,
    writeOnly: true,
    description:
      'Google ID token, trimmed before validation. Identity is verified with the provider.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(ID_TOKEN_MAX_LENGTH)
  @Trim()
  declare idToken: string;
}
