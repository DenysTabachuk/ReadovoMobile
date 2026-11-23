import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../../common/validation/transforms';
import { LearningLocaleDto } from '../../dto/learning-locale.dto';

export class GetLearningCatalogueDto extends LearningLocaleDto {
  @ApiPropertyOptional({
    type: String,
    minLength: 1,
    description: 'Parent topic slug. Omit to browse root topics.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Trim()
  topic?: string;
}
