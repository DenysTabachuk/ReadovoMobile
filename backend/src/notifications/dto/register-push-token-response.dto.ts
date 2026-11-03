import { ApiProperty, ApiSchema } from '@nestjs/swagger';

/** Shared acknowledgment for token registration and deactivation. */
@ApiSchema({ name: 'PushTokenAcknowledgment' })
export class RegisterPushTokenResponseDto {
  @ApiProperty({ type: Boolean, enum: [true] })
  declare ok: true;
}
