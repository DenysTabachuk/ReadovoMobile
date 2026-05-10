import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

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

  @Get('users/:userId/words')
  findAll(@Param('userId') userId: string): Promise<DictionaryWord[]> {
    return this.dictionaryService.findAll(userId);
  }

  @Post('users/:userId/words')
  createWord(
    @Param('userId') userId: string,
    @Body() body: CreateDictionaryWordRequest,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.createWord(userId, body);
  }

  @Patch('users/:userId/words/:wordId/progress')
  updateWordProgress(
    @Param('userId') userId: string,
    @Param('wordId') wordId: string,
    @Body() body: UpdateDictionaryWordProgressRequest,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.updateWordProgress(userId, wordId, body);
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

  @Get('users/:userId/test')
  createTest(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<DictionaryTest> {
    return this.dictionaryService.createTest(userId, Number(limit ?? 10));
  }

  @Post('users/:userId/test/answer')
  submitTestAnswer(
    @Param('userId') userId: string,
    @Body() body: SubmitDictionaryTestAnswerRequest,
  ): Promise<DictionaryTestAnswerResult> {
    return this.dictionaryService.submitTestAnswer(userId, body);
  }
}
