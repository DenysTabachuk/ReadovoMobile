import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { LearningCatalogueService } from './catalogue/learning-catalogue.service';
import { LearningLessonService } from './lessons/learning-lesson.service';
import { LEARNING_ERRORS } from './learning-errors';
import { GetLearningCatalogueDto } from './catalogue/dto/get-learning-catalogue.dto';
import { GetLearningCatalogueResponseDto } from './catalogue/dto/get-learning-catalogue-response.dto';
import { GetLearningLessonDto } from './lessons/dto/get-learning-lesson.dto';
import { GetLearningLessonResponseDto } from './lessons/dto/get-learning-lesson-response.dto';
import { LearningLessonSlugDto } from './lessons/dto/learning-lesson-slug.dto';
import { CheckReadingAnswerParamsDto } from './reading/dto/check-reading-answer-params.dto';
import { CheckLearningAnswerDto } from './dto/check-learning-answer.dto';
import { CheckReadingAnswerResponseDto } from './reading/dto/check-reading-answer-response.dto';
import { CheckLearningVocabularyAnswerParamsDto } from './vocabulary/dto/check-learning-vocabulary-answer-params.dto';
import { CheckVocabularyAnswerResponseDto } from './vocabulary/dto/check-vocabulary-answer-response.dto';

@ApiTags('learning')
@Controller('learning')
export class LearningController {
  constructor(
    private readonly catalogueService: LearningCatalogueService,
    private readonly lessonService: LearningLessonService,
  ) {}

  @Get('catalogue')
  @ApiOperation({
    operationId: 'getLearningCatalogue',
    summary: 'Browse published topics and their thematic lessons',
  })
  @ApiOkResponse({ type: GetLearningCatalogueResponseDto })
  @ApiUserAuth({ validation: true, errors: [LEARNING_ERRORS.NOT_FOUND] })
  catalogue(@Query() query: GetLearningCatalogueDto) {
    return this.catalogueService.getCatalogue(query);
  }

  @Get('lessons/:slug')
  @ApiOperation({
    operationId: 'getLearningLesson',
    summary: 'Read one thematic lesson at the requested English level',
    description:
      'Words, vocabulary practice questions, prepared reading and unanswered comprehension questions belong to the same variant. Unavailable levels return variant: null, without fallback.',
  })
  @ApiOkResponse({ type: GetLearningLessonResponseDto })
  @ApiUserAuth({ validation: true, errors: [LEARNING_ERRORS.NOT_FOUND] })
  lesson(
    @Param() { slug }: LearningLessonSlugDto,
    @Query() query: GetLearningLessonDto,
  ) {
    return this.lessonService.getLesson(slug, query);
  }

  @Post('lessons/:slug/questions/:questionId/check')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'checkReadingAnswer',
    summary:
      'Check an authored comprehension answer without saving progress or awarding rewards',
  })
  @ApiOkResponse({ type: CheckReadingAnswerResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [LEARNING_ERRORS.NOT_FOUND, LEARNING_ERRORS.OPTION_NOT_AVAILABLE],
  })
  checkReadingAnswer(
    @Param() { slug, questionId }: CheckReadingAnswerParamsDto,
    @Query() { level }: GetLearningLessonDto,
    @Body() { optionId }: CheckLearningAnswerDto,
  ) {
    return this.lessonService.checkReadingAnswer(
      slug,
      level,
      questionId,
      optionId,
    );
  }
  @Post('lessons/:slug/vocabulary/exercises/:exerciseId/check')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'checkVocabularyAnswer',
    summary:
      'Check a vocabulary answer for a published thematic lesson variant',
  })
  @ApiOkResponse({ type: CheckVocabularyAnswerResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [LEARNING_ERRORS.NOT_FOUND, LEARNING_ERRORS.OPTION_NOT_AVAILABLE],
  })
  checkVocabularyAnswer(
    @Param() { slug, exerciseId }: CheckLearningVocabularyAnswerParamsDto,
    @Query() { level }: GetLearningLessonDto,
    @Body() { optionId }: CheckLearningAnswerDto,
  ) {
    return this.lessonService.checkVocabularyAnswer(
      slug,
      level,
      exerciseId,
      optionId,
    );
  }
}
