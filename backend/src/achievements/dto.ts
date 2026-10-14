import {
  IsDefined,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const MAX_PROGRESS_VALUE = 2_147_483_647;

export class UpdateProgressDto {
  @IsInt()
  @IsOptional()
  @Max(MAX_PROGRESS_VALUE)
  @Min(0)
  balance?: number;

  @IsInt()
  @IsOptional()
  @Max(MAX_PROGRESS_VALUE)
  @Min(0)
  lessonsCompleted?: number;

  @IsInt()
  @IsOptional()
  @Max(MAX_PROGRESS_VALUE)
  @Min(0)
  testsCompleted?: number;

  @IsInt()
  @IsOptional()
  @Max(MAX_PROGRESS_VALUE)
  @Min(0)
  wordsLearned?: number;

  @IsDefined({ message: 'At least one progress field is required.' })
  @ValidateIf(
    (value: UpdateProgressDto) =>
      value.balance === undefined &&
      value.lessonsCompleted === undefined &&
      value.testsCompleted === undefined &&
      value.wordsLearned === undefined,
  )
  private readonly atLeastOneProgressField?: never;
}
