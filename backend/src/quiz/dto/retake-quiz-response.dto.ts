import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'RetakeQuizResponse' })
export class RetakeQuizResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  declare sessionId: string;
}
