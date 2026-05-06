import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { DictionaryService } from './dictionary.service';
import {
  type CreateDictionaryWordRequest,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryWord,
  type GenerateEmbeddingRequest,
  type QuizOptionsRequest,
  type SimilarWordsRequest,
  type SubmitDictionaryTestAnswerRequest,
  type UpdateDictionaryWordProgressRequest,
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

  @Patch('words/:wordId/progress')
  updateWordProgress(
    @Param('wordId') wordId: string,
    @Body() body: UpdateDictionaryWordProgressRequest,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.updateWordProgress(wordId, body);
  }

  @Post('embedding')
  generateEmbedding(@Body() body: GenerateEmbeddingRequest): Promise<number[]> {
    return this.dictionaryService.generateEmbedding(body.text ?? '');
  }

  @Post('similar-words')
  getSimilarWords(@Body() body: SimilarWordsRequest): Promise<string[]> {
    return this.dictionaryService.getSimilarWords(body);
  }

  @Post('quiz-options')
  generateQuizOptions(@Body() body: QuizOptionsRequest): Promise<string[]> {
    return this.dictionaryService.generateQuizOptions(body);
  }

  @Get('test')
  createTest(@Query('limit') limit?: string): Promise<DictionaryTest> {
    return this.dictionaryService.createTest(Number(limit ?? 10));
  }

  @Post('test/answer')
  submitTestAnswer(
    @Body() body: SubmitDictionaryTestAnswerRequest,
  ): Promise<DictionaryTestAnswerResult> {
    return this.dictionaryService.submitTestAnswer(body);
  }
}
