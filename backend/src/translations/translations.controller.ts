import { Body, Controller, Post } from '@nestjs/common';

import { TranslateWordDto } from './dto';
import { TranslationsService } from './translations.service';
import { type TranslateWordResponse } from './types';

@Controller('api/translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Post('word')
  async translateWord(
    @Body() body: TranslateWordDto,
  ): Promise<TranslateWordResponse> {
    return this.translationsService.translateWord(body);
  }
}
