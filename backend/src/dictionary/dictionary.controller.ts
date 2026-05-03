import { Body, Controller, Get, Post } from '@nestjs/common';

import { DictionaryService } from './dictionary.service';
import {
  type CreateDictionaryWordRequest,
  type DictionaryWord,
} from './types';

@Controller('api/dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('words')
  findAll(): Promise<DictionaryWord[]> {
    return this.dictionaryService.findAll();
  }

  @Post('words')
  createWord(
    @Body() body: CreateDictionaryWordRequest,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.createWord(body);
  }
}
