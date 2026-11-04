import { ApiProperty, ApiSchema } from '@nestjs/swagger';

/** Delivery failures remain a successful HTTP result with safe diagnostics. */
@ApiSchema({ name: 'SendTestPushResponse' })
export class SendTestPushResponseDto {
  @ApiProperty({ type: 'integer', minimum: 0 })
  declare failedCount: number;

  @ApiProperty({
    type: [String],
    description:
      'Sanitized delivery diagnostics, not API error codes. May be empty.',
  })
  declare failureReasons: string[];

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare sentCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare tokenCount: number;
}
