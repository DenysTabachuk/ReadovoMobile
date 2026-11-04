import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { Trim } from '../../common/validation/transforms';
import { PUSH_DEVICE_ID_MAX_LENGTH } from '../constants';

@ApiSchema({ name: 'DeactivatePushTokenQuery' })
export class DeviceIdQueryDto {
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
}
