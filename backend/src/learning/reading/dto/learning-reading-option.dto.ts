import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'LearningReadingOption' })
export class LearningReadingOptionDto {
  @ApiProperty({ type: String })
  declare id: string;
  @ApiProperty({ type: String })
  declare text: string;
}
