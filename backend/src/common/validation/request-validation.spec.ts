import 'reflect-metadata';

import { type Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CompleteQuizDto, SubmitQuizAnswerDto } from '../../quiz/dto';
import {
  ArticleDetailQueryDto,
  ArticleListQueryDto,
} from '../../articles/contracts/dto';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';
import {
  CreateDictionaryWordDto,
  DictionaryWordParamsDto,
} from '../../dictionary/dto';
import { ClearMascotSlotParamsDto } from '../../mascot/dto';
import { RegisterPushTokenDto } from '../../notifications/dto';
import { ApplyStreakFreezeDto } from '../../streak/dto';
import { TranslateWordDto } from '../../translations/dto';

describe('HTTP request DTO validation', () => {
  it('normalizes a valid registration request', async () => {
    const { errors, instance } = await validateDto(RegisterUserDto, {
      email: ' New.User@Example.com ',
      password: 'password123',
      passwordConfirmation: 'password123',
    });

    expect(errors).toHaveLength(0);
    expect(instance.email).toBe('new.user@example.com');
  });

  it('enforces password policy and confirmation at the HTTP boundary', async () => {
    const { errors } = await validateDto(RegisterUserDto, {
      email: 'user@example.com',
      password: 'short',
      passwordConfirmation: 'different',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('rejects malformed UUID route parameters', async () => {
    const { errors } = await validateDto(DictionaryWordParamsDto, {
      wordId: 'not-a-uuid',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('transforms and validates article query values', async () => {
    const { errors, instance } = await validateDto(ArticleListQueryDto, {
      category: ' SCIENCE ',
      excludeIds: '10, 20,10',
      limit: '12',
      preferImagesFirst: 'false',
      recommended: 'true',
    });

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      category: 'science',
      excludeIds: [10, 20],
      limit: 12,
      preferImagesFirst: false,
      recommended: true,
    });
  });

  it('rejects invalid article booleans instead of coercing them', async () => {
    const { errors } = await validateDto(ArticleListQueryDto, {
      recommended: 'yes',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('rejects unsupported Wikipedia language codes explicitly', async () => {
    const { errors } = await validateDto(ArticleDetailQueryDto, {
      languageCode: 'uk',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('validates dictionary request structure while leaving word-count policy to the service', async () => {
    const valid = await validateDto(CreateDictionaryWordDto, {
      context: ' A useful context. ',
      translation: ' переклад ',
      word: 'one two three four five six',
    });
    const invalid = await validateDto(CreateDictionaryWordDto, {
      context: 'context',
      translation: '',
      word: 'word',
    });

    expect(valid.errors).toHaveLength(0);
    expect(valid.instance.translation).toBe('переклад');
    expect(invalid.errors).not.toHaveLength(0);
  });

  it('accepts opaque option identifiers for a saved quiz question', async () => {
    const { errors } = await validateDto(SubmitQuizAnswerDto, {
      questionId: 'q-1',
      selectedOptionIds: ['option-1'],
    });
    expect(errors).toHaveLength(0);
  });

  it('validates notification token contracts', async () => {
    const { errors } = await validateDto(RegisterPushTokenDto, {
      deviceId: 'device-1',
      platform: 'ios',
      provider: 'fcm',
      pushToken: 'short',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('validates quiz completion timezones', async () => {
    const { errors } = await validateDto(CompleteQuizDto, {
      timezone: 'Not/A_Timezone',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('rejects calendar dates that do not exist', async () => {
    const { errors } = await validateDto(ApplyStreakFreezeDto, {
      date: '2026-02-29',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('normalizes translation language codes', async () => {
    const { errors, instance } = await validateDto(TranslateWordDto, {
      sourceLanguage: ' EN ',
      targetLanguage: ' UK ',
      word: ' hello ',
    });

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'hello',
    });
  });

  it('rejects unknown mascot slots', async () => {
    const { errors } = await validateDto(ClearMascotSlotParamsDto, {
      slot: 'shoes',
      userId: 'efbda94b-8972-4f41-9f30-f93faa10bb9f',
    });

    expect(errors).not.toHaveLength(0);
  });
});

async function validateDto<T extends object>(
  dto: Type<T>,
  value: Record<string, unknown>,
): Promise<{ errors: Awaited<ReturnType<typeof validate>>; instance: T }> {
  const instance = plainToInstance(dto, value);
  const errors = await validate(instance, {
    forbidNonWhitelisted: true,
    whitelist: true,
  });

  return { errors, instance };
}
