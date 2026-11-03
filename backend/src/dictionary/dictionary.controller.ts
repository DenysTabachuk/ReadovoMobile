import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { DICTIONARY_ERRORS } from './dictionary-errors';
import { DictionaryWordResponseDto } from './dto/dictionary-word-response.dto';
import { GetDictionaryTestResponseDto } from './dto/get-dictionary-test-response.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types';
import { CreateDictionaryWordDto } from './dto/create-dictionary-word.dto';
import { DictionaryTestQueryDto } from './dto/dictionary-test-query.dto';
import { DictionaryWordParamsDto } from './dto/dictionary-word-params.dto';
import { GenerateEmbeddingDto } from './dto/generate-embedding.dto';
import { QuizOptionsDto } from './dto/quiz-options.dto';
import { SimilarWordsDto } from './dto/similar-words.dto';
import { UpdateDictionaryWordProgressDto } from './dto/update-dictionary-word-progress.dto';
import { DictionaryService } from './dictionary.service';
import { type DictionaryTest, type DictionaryWord } from './types';

@ApiTags('Dictionary')
@Controller('api/dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('me/words')
  @ApiOperation({ operationId: 'getDictionaryWords' })
  @ApiOkResponse({ type: [DictionaryWordResponseDto] })
  @ApiUserAuth()
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<DictionaryWord[]> {
    return this.dictionaryService.findAll(user.id);
  }

  @Post('me/words')
  @ApiOperation({ operationId: 'createDictionaryWord' })
  @ApiCreatedResponse({ type: DictionaryWordResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      DICTIONARY_ERRORS.WORD_TOO_LONG,
      DICTIONARY_ERRORS.WORD_ALREADY_EXISTS,
    ],
  })
  createWord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDictionaryWordDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.createWord(user.id, body);
  }

  @Delete('me/words/:wordId')
  @ApiOperation({ operationId: 'deleteDictionaryWord' })
  @ApiOkResponse({ type: DictionaryWordResponseDto })
  @ApiUserAuth({ validation: true, errors: [DICTIONARY_ERRORS.WORD_NOT_FOUND] })
  deleteWord(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { wordId }: DictionaryWordParamsDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.deleteWord(user.id, wordId);
  }

  @Patch('me/words/:wordId/progress')
  @ApiOperation({ operationId: 'updateDictionaryWordProgress' })
  @ApiOkResponse({ type: DictionaryWordResponseDto })
  @ApiUserAuth({ validation: true, errors: [DICTIONARY_ERRORS.WORD_NOT_FOUND] })
  updateWordProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { wordId }: DictionaryWordParamsDto,
    @Body() body: UpdateDictionaryWordProgressDto,
  ): Promise<DictionaryWord> {
    return this.dictionaryService.updateWordProgress(user.id, wordId, body);
  }

  @Post('embedding')
  @ApiOperation({ operationId: 'generateDictionaryEmbedding', security: [] })
  @ApiCreatedResponse({ type: [Number] })
  @ApiErrorResponses({ validation: true, errors: [] })
  generateEmbedding(@Body() body: GenerateEmbeddingDto): Promise<number[]> {
    return this.dictionaryService.generateEmbedding(body.text);
  }

  @Post('similar-words')
  @ApiOperation({ operationId: 'getSimilarDictionaryWords', security: [] })
  @ApiCreatedResponse({ type: [String] })
  @ApiErrorResponses({
    validation: true,
    errors: [DICTIONARY_ERRORS.EMBEDDINGS_INVALID],
  })
  getSimilarWords(@Body() body: SimilarWordsDto): Promise<string[]> {
    return this.dictionaryService.getSimilarWords(body);
  }

  @Post('quiz-options')
  @ApiOperation({ operationId: 'generateDictionaryQuizOptions', security: [] })
  @ApiCreatedResponse({ type: [String] })
  @ApiErrorResponses({
    validation: true,
    errors: [
      DICTIONARY_ERRORS.EMBEDDINGS_INVALID,
      DICTIONARY_ERRORS.QUIZ_DISTRACTORS_INSUFFICIENT,
    ],
  })
  generateQuizOptions(@Body() body: QuizOptionsDto): Promise<string[]> {
    return this.dictionaryService.generateQuizOptions(body);
  }

  @Get('me/test')
  @ApiOperation({ operationId: 'getDictionaryTest' })
  @ApiOkResponse({ type: GetDictionaryTestResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      DICTIONARY_ERRORS.TEST_NO_WORDS,
      DICTIONARY_ERRORS.TEST_NO_REVIEW_CANDIDATES,
      DICTIONARY_ERRORS.TEST_GENERATION_FAILED,
      DICTIONARY_ERRORS.TEST_GENERATION_EMPTY,
      DICTIONARY_ERRORS.TEST_GENERATION_INVALID_RESPONSE,
      DICTIONARY_ERRORS.TEST_GENERATION_INCOMPLETE,
    ],
  })
  createTest(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { limit }: DictionaryTestQueryDto,
  ): Promise<DictionaryTest> {
    return this.dictionaryService.createTest(user.id, limit);
  }
}
