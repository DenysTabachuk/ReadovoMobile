import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '../../common/validation/transforms';
import {
  PUSH_DEVICE_ID_MAX_LENGTH,
  PUSH_PLATFORMS,
  PUSH_PROVIDERS,
  PUSH_TOKEN_MAX_LENGTH,
  PUSH_TOKEN_MIN_LENGTH,
} from '../constants';

const requestSchema = {
  name: 'RegisterPushTokenRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class RegisterPushTokenDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: PUSH_DEVICE_ID_MAX_LENGTH,
    description: 'Device ID, trimmed before validation.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(PUSH_DEVICE_ID_MAX_LENGTH)
  @Trim()
  declare deviceId: string;

  @ApiProperty({ enum: PUSH_PLATFORMS })
  @IsIn(PUSH_PLATFORMS)
  declare platform: (typeof PUSH_PLATFORMS)[number];

  @ApiProperty({ enum: PUSH_PROVIDERS })
  @IsIn(PUSH_PROVIDERS)
  declare provider: (typeof PUSH_PROVIDERS)[number];

  @ApiProperty({
    type: String,
    minLength: PUSH_TOKEN_MIN_LENGTH,
    maxLength: PUSH_TOKEN_MAX_LENGTH,
    description: 'FCM token, trimmed before validation.',
  })
  @IsString()
  @MaxLength(PUSH_TOKEN_MAX_LENGTH)
  @MinLength(PUSH_TOKEN_MIN_LENGTH)
  @Trim()
  declare pushToken: string;
}
