import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

@ApiSchema({ name: 'QuizSessionParams' })
export class QuizSessionParamsDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  declare sessionId: string;
}
