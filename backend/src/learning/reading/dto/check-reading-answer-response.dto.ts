import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'CheckReadingAnswerResponse' })
export class CheckReadingAnswerResponseDto {
  @ApiProperty({ type: String })
  declare questionId: string;
  @ApiProperty({ type: String })
  declare selectedOptionId: string;
  @ApiProperty({ type: String })
  declare correctOptionId: string;
  @ApiProperty({ type: Boolean })
  declare isCorrect: boolean;
  @ApiProperty({ type: String })
  declare explanation: string;
}
