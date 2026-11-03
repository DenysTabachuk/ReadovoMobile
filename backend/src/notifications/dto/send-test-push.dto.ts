import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { Trim } from '../../common/validation/transforms';

const MAX_TEST_PUSH_BODY_LENGTH = 2_000;
const MAX_TEST_PUSH_TITLE_LENGTH = 200;
const requestSchema = {
  name: 'SendTestPushRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class SendTestPushDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: MAX_TEST_PUSH_BODY_LENGTH,
    description:
      'Trimmed. Null, omission or an empty string uses the default message.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEST_PUSH_BODY_LENGTH)
  @Trim()
  body?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: MAX_TEST_PUSH_TITLE_LENGTH,
    description:
      'Trimmed. Null, omission or an empty string uses the default title.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEST_PUSH_TITLE_LENGTH)
  @Trim()
  title?: string | null;
}
