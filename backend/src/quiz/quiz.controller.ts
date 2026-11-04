import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { ACHIEVEMENTS_ERRORS } from '../achievements/contracts';
import { STREAK_ERRORS } from '../streak/contracts';
import { CompleteQuizDto } from './dto/complete-quiz.dto';
import { QuizSessionParamsDto } from './dto/quiz-session-params.dto';
import { SubmitQuizAnswerDto } from './dto/submit-quiz-answer.dto';
import { SubmitQuizAnswerResponseDto } from './dto/submit-quiz-answer-response.dto';
import { CompleteQuizResponseDto } from './dto/complete-quiz-response.dto';
import { RetakeQuizResponseDto } from './dto/retake-quiz-response.dto';
import { QUIZ_ERRORS } from './quiz-errors';
import { QuizService } from './quiz.service';

@Controller('quiz-sessions')
@ApiTags('quiz-sessions')
@ApiExtraModels(QuizSessionParamsDto)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Post(':sessionId/answers')
  @ApiOperation({
    operationId: 'submitQuizAnswer',
    summary: 'Submit a graded answer to an owned quiz session',
  })
  @ApiCreatedResponse({ type: SubmitQuizAnswerResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      QUIZ_ERRORS.SESSION_NOT_FOUND,
      QUIZ_ERRORS.ANSWER_INVALID,
      QUIZ_ERRORS.ANSWER_ALREADY_SUBMITTED,
      QUIZ_ERRORS.SESSION_COMPLETED,
      ACHIEVEMENTS_ERRORS.USER_NOT_FOUND,
    ],
  })
  answer(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { sessionId }: QuizSessionParamsDto,
    @Body() body: SubmitQuizAnswerDto,
  ) {
    return this.quiz.answer(user.id, sessionId, body);
  }

  @Post(':sessionId/complete')
  @ApiOperation({
    operationId: 'completeQuiz',
    summary:
      'Complete an owned quiz and return saved rewards with current profiles',
  })
  @ApiBody({ type: CompleteQuizDto, required: false })
  @ApiCreatedResponse({ type: CompleteQuizResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      QUIZ_ERRORS.SESSION_NOT_FOUND,
      QUIZ_ERRORS.SESSION_INCOMPLETE,
      ACHIEVEMENTS_ERRORS.USER_NOT_FOUND,
      STREAK_ERRORS.USER_NOT_FOUND,
    ],
  })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { sessionId }: QuizSessionParamsDto,
    @Body() body: CompleteQuizDto,
  ) {
    // IsOptional accepts null; the service represents an absent timezone as undefined.
    return this.quiz.complete(user.id, sessionId, body.timezone ?? undefined);
  }

  @Post(':sessionId/retake')
  @ApiOperation({
    operationId: 'retakeQuiz',
    summary: 'Create a new owned attempt from a saved quiz session',
  })
  @ApiCreatedResponse({ type: RetakeQuizResponseDto })
  @ApiUserAuth({ validation: true, errors: [QUIZ_ERRORS.SESSION_NOT_FOUND] })
  async retake(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { sessionId }: QuizSessionParamsDto,
  ) {
    return { sessionId: await this.quiz.retake(user.id, sessionId) };
  }
}
