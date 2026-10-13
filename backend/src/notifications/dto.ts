import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '../common/validation/transforms';

export class UpsertLearningReminderPreferencesDto {
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @Trim()
  learningReminderTime?: string;

  @IsBoolean()
  learningRemindersEnabled!: boolean;
}

export class RegisterPushTokenDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Trim()
  deviceId!: string;

  @IsIn(['android'])
  platform!: 'android';

  @IsIn(['fcm'])
  provider!: 'fcm';

  @IsString()
  @MaxLength(4_096)
  @MinLength(32)
  @Trim()
  pushToken!: string;
}

export class SendTestPushDto {
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  @Trim()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Trim()
  title?: string;
}

export class DeviceIdQueryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Trim()
  deviceId!: string;
}
