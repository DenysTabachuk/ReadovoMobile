import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { Trim } from '../../common/validation/transforms';

const REFRESH_TOKEN_MAX_LENGTH = 1024;
const requestSchema = {
  name: 'RefreshSessionRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class RefreshSessionDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: REFRESH_TOKEN_MAX_LENGTH,
    writeOnly: true,
    description:
      'Refresh credential in the body; an access JWT is not required. Trimmed before validation.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(REFRESH_TOKEN_MAX_LENGTH)
  @Trim()
  declare refreshToken: string;
}
