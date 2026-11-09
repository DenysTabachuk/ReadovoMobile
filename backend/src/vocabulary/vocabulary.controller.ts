import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { VocabularyService } from './vocabulary.service';
import { VOCABULARY_ERRORS } from './vocabulary-errors';
import { ListVocabularyLessonsDto } from './dto/list-vocabulary-lessons.dto';
import { ListVocabularyLessonsResponseDto } from './dto/list-vocabulary-lessons-response.dto';
import { GetVocabularyLessonDto } from './dto/get-vocabulary-lesson.dto';
import { GetVocabularyLessonResponseDto } from './dto/get-vocabulary-lesson-response.dto';

@ApiTags('vocabulary')
@Controller('vocabulary/lessons')
export class VocabularyController {
  constructor(private readonly vocabulary: VocabularyService) {}

  @Get()
  @ApiOperation({
    operationId: 'listVocabularyLessons',
    summary: 'List published vocabulary lessons',
  })
  @ApiOkResponse({ type: ListVocabularyLessonsResponseDto })
  @ApiUserAuth({ validation: true })
  listLessons(@Query() query: ListVocabularyLessonsDto) {
    return this.vocabulary.listLessons(query);
  }

  @Get(':slug')
  @ApiOperation({
    operationId: 'getVocabularyLesson',
    summary: 'Read a published lesson overview and word cards',
    description:
      'Includes ordered stage rosters and exercise counts. Does not expose practice questions, answer keys or user progress.',
  })
  @ApiOkResponse({ type: GetVocabularyLessonResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [VOCABULARY_ERRORS.LESSON_NOT_FOUND],
  })
  getLesson(
    @Param() { slug }: GetVocabularyLessonDto,
    @Query() query: ListVocabularyLessonsDto,
  ) {
    return this.vocabulary.getLesson(slug, query);
  }
}
