import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { AUTH_RESET_TOKEN_PATTERN } from '../constants';

@ApiSchema({ name: 'VerifyPasswordResetCodeResponse' })
export class VerifyPasswordResetCodeResponseDto {
  @ApiProperty({ type: String, format: 'email' })
  declare email: string;

  @ApiProperty({ type: String, pattern: AUTH_RESET_TOKEN_PATTERN.source })
  declare resetToken: string;
}
