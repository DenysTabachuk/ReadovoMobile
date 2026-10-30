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
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types';
import {
  CreateDictionaryWordDto,
  DictionaryTestQueryDto,
  DictionaryWordParamsDto,
  GenerateEmbeddingDto,
  QuizOptionsDto,
  SimilarWordsDto,
  UpdateDictionaryWordProgressDto,
} from './dto';
import { DictionaryService } from './dictionary.service';
import { type DictionaryTest, type DictionaryWord } from './types';

@Controller('api/dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('me/words')
  @UseGuards(UserAuthGuard)
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<DictionaryWord[]> {
    return this.dictionaryService.findAll(user.id);
  }

  @Post('me/words')
  @UseGuards(UserAuthGuard)
  createWord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDictionaryWordDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.createWord(user.id, body);
  }

  @Delete('me/words/:wordId')
  @UseGuards(UserAuthGuard)
  deleteWord(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { wordId }: DictionaryWordParamsDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.deleteWord(user.id, wordId);
  }

  @Patch('me/words/:wordId/progress')
  @UseGuards(UserAuthGuard)
  updateWordProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { wordId }: DictionaryWordParamsDto,
    @Body() body: UpdateDictionaryWordProgressDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.updateWordProgress(user.id, wordId, body);
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

  @Get('me/test')
  @UseGuards(UserAuthGuard)
  createTest(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { limit }: DictionaryTestQueryDto,
  ): Promise<DictionaryTest> {
    return this.dictionaryService.createTest(user.id, limit);
  }
}
