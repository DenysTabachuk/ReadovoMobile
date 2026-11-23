import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/validation/transforms';

@ApiSchema({ name: 'CheckLearningAnswerRequest' })
export class CheckLearningAnswerDto {
  @ApiProperty({ type: String, minLength: 1 })
  @IsString()
  @IsNotEmpty()
  @Trim()
  declare optionId: string;
}
