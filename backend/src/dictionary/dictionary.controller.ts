import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import {
  UserAndWordIdParamsDto,
  UserIdParamsDto,
} from '../common/validation/request.dto';
import {
  CreateDictionaryWordDto,
  DictionaryTestQueryDto,
  GenerateEmbeddingDto,
  QuizOptionsDto,
  SimilarWordsDto,
  SubmitDictionaryTestAnswerDto,
  UpdateDictionaryWordProgressDto,
} from './dto';
import { DictionaryService } from './dictionary.service';
import {
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryWord,
} from './types';

@Controller('api/dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('users/:userId/words')
  @UseGuards(UserAuthGuard)
  findAll(@Param() { userId }: UserIdParamsDto): Promise<DictionaryWord[]> {
    return this.dictionaryService.findAll(userId);
  }

  @Post('users/:userId/words')
  @UseGuards(UserAuthGuard)
  createWord(
    @Param() { userId }: UserIdParamsDto,
    @Body() body: CreateDictionaryWordDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.createWord(userId, body);
  }

  @Delete('users/:userId/words/:wordId')
  @UseGuards(UserAuthGuard)
  deleteWord(
    @Param() { userId, wordId }: UserAndWordIdParamsDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.deleteWord(userId, wordId);
  }

  @Patch('users/:userId/words/:wordId/progress')
  @UseGuards(UserAuthGuard)
  updateWordProgress(
    @Param() { userId, wordId }: UserAndWordIdParamsDto,
    @Body() body: UpdateDictionaryWordProgressDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.updateWordProgress(userId, wordId, body);
  }

  @Post('embedding')
  generateEmbedding(@Body() body: GenerateEmbeddingDto): Promise<number[]> {
    return this.dictionaryService.generateEmbedding(body.text);
  }

  @Post('similar-words')
  getSimilarWords(@Body() body: SimilarWordsDto): Promise<string[]> {
    return this.dictionaryService.getSimilarWords(body);
  }

  @Post('quiz-options')
  generateQuizOptions(@Body() body: QuizOptionsDto): Promise<string[]> {
    return this.dictionaryService.generateQuizOptions(body);
  }

  @Get('users/:userId/test')
  @UseGuards(UserAuthGuard)
  createTest(
    @Param() { userId }: UserIdParamsDto,
    @Query() { limit }: DictionaryTestQueryDto,
  ): Promise<DictionaryTest> {
    return this.dictionaryService.createTest(userId, limit);
  }

  @Post('users/:userId/test/answer')
  @UseGuards(UserAuthGuard)
  submitTestAnswer(
    @Param() { userId }: UserIdParamsDto,
    @Body() body: SubmitDictionaryTestAnswerDto,
  ): Promise<DictionaryTestAnswerResult> {
    return this.dictionaryService.submitTestAnswer(userId, body);
  }
}
