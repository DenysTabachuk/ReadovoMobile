import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'AuthUser' })
export class AuthUserResponseDto {
  @ApiProperty({ type: Number })
  declare balance: number;

  @ApiProperty({ type: String, format: 'date-time' })
  declare createdAt: string;

  @ApiProperty({ type: String, format: 'email' })
  declare email: string;

  @ApiProperty({ type: String, format: 'uuid' })
  declare id: string;

  @ApiProperty({ type: Number })
  declare lessonsCompleted: number;

  @ApiProperty({ type: Number })
  declare testsCompleted: number;

  @ApiProperty({ type: Number })
  declare wordsLearned: number;
}

/** Shared serialized session for login, Google login, refresh and email verification. */
@ApiSchema({ name: 'AuthSessionResponse' })
export class AuthSessionResponseDto {
  @ApiProperty({ type: String })
  declare accessToken: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare accessTokenExpiresAt: string;

  @ApiProperty({ type: String })
  declare refreshToken: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare refreshTokenExpiresAt: string;

  @ApiProperty({ type: AuthUserResponseDto })
  declare user: AuthUserResponseDto;
}
