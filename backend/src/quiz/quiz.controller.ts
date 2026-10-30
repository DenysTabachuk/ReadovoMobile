import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { UserAuthGuard } from '../auth/user-auth.guard';
import {
  CompleteQuizDto,
  QuizSessionParamsDto,
  SubmitQuizAnswerDto,
} from './dto';
import { QuizService } from './quiz.service';

@Controller('quiz-sessions')
@UseGuards(UserAuthGuard)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Post(':sessionId/answers')
  answer(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { sessionId }: QuizSessionParamsDto,
    @Body() body: SubmitQuizAnswerDto,
  ) {
    return this.quiz.answer(user.id, sessionId, body);
  }

  @Post(':sessionId/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { sessionId }: QuizSessionParamsDto,
    @Body() body: CompleteQuizDto,
  ) {
    return this.quiz.complete(user.id, sessionId, body.timezone);
  }

  @Post(':sessionId/retake')
  async retake(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { sessionId }: QuizSessionParamsDto,
  ) {
    return { sessionId: await this.quiz.retake(user.id, sessionId) };
  }
}
