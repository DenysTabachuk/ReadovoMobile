import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ResetPasswordResponse' })
export class ResetPasswordResponseDto {
  @ApiProperty({ type: String, format: 'email' })
  declare email: string;
}
