import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';

import { TranslateWordDto } from './dto/translate-word.dto';
import { TranslationsService } from './translations.service';
import { type TranslateWordResponse } from './types';
import { TranslateWordResponseDto } from './dto/translate-word-response.dto';
import { TRANSLATIONS_ERRORS } from './translations-errors';

@Controller('api/translations')
@ApiTags('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Post('word')
  @ApiOperation({
    operationId: 'translateWord',
    summary: 'Translate a selected word with optional sentence context',
    security: [],
  })
  @ApiCreatedResponse({ type: TranslateWordResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [
      TRANSLATIONS_ERRORS.REQUEST_FAILED,
      TRANSLATIONS_ERRORS.UNAVAILABLE,
    ],
  })
  async translateWord(
    @Body() body: TranslateWordDto,
  ): Promise<TranslateWordResponse> {
    return this.translationsService.translateWord(body);
  }
}
