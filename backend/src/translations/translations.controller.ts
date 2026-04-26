import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { TranslationsService } from './translations.service';
import {
  type TranslateWordRequest,
  type TranslateWordResponse,
} from './types';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,10}$/i;

@Controller('api/translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Post('word')
  async translateWord(
    @Body() body: TranslateWordRequest,
  ): Promise<TranslateWordResponse> {
    const word = body.word?.trim();
    const context = body.context?.trim();
    const sourceLanguage = body.sourceLanguage?.trim().toLowerCase() ?? 'en';
    const targetLanguage = body.targetLanguage?.trim().toLowerCase() ?? 'uk';

    if (!word) {
      throw new BadRequestException('Word is required.');
    }

    if (!LANGUAGE_CODE_PATTERN.test(sourceLanguage)) {
      throw new BadRequestException('Source language is invalid.');
    }

    if (!LANGUAGE_CODE_PATTERN.test(targetLanguage)) {
      throw new BadRequestException('Target language is invalid.');
    }

    return this.translationsService.translateWord({
      context,
      sourceLanguage,
      targetLanguage,
      word,
    });
  }
}
