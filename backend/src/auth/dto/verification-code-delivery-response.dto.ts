import { ApiProperty, ApiSchema } from '@nestjs/swagger';

/** Acknowledgment shared by registration, verification resend and password reset. */
@ApiSchema({ name: 'VerificationCodeDeliveryResponse' })
export class VerificationCodeDeliveryResponseDto {
  @ApiProperty({ type: String, format: 'email' })
  declare email: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare verificationExpiresAt: string;
}
