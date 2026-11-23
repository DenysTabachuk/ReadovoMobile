import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception';
import type { Prisma } from '../../generated/prisma/client';
import { LEARNING_ERRORS } from '../learning-errors';
import type { CheckReadingAnswerResponseDto } from './dto/check-reading-answer-response.dto';

export const READING_QUESTION_INCLUDE = {
  questions: {
    orderBy: { position: 'asc' },
    include: { options: { orderBy: { position: 'asc' } } },
  },
} satisfies Prisma.LearningLessonVariantInclude;

export type LearningReadingVariant = Prisma.LearningLessonVariantGetPayload<{
  include: typeof READING_QUESTION_INCLUDE;
}>;

const MIN_READING_OPTIONS = 2;

@Injectable()
export class LearningReadingService {
  /** Validates stored reading content and exposes only the unanswered questions. */
  getContent(variant: LearningReadingVariant) {
    this.validateContent(variant);
    return {
      readingTitle: variant.readingTitle,
      readingParagraphs: variant.readingParagraphs,
      questions: variant.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      })),
    };
  }

  /** Grades a single choice against the published answer without saving an attempt. */
  checkAnswer(
    variant: LearningReadingVariant,
    questionId: string,
    optionId: string,
  ): CheckReadingAnswerResponseDto {
    this.validateContent(variant);
    const question = variant.questions.find(
      (candidate) => candidate.id === questionId,
    );
    if (!question) throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    const selected = question.options.find((option) => option.id === optionId);
    if (!selected) throw new ApiException(LEARNING_ERRORS.OPTION_NOT_AVAILABLE);
    const correct = question.options.find((option) => option.isCorrect);
    if (!correct) throw new Error('Published reading answer is missing.');
    return {
      questionId,
      selectedOptionId: selected.id,
      correctOptionId: correct.id,
      isCorrect: selected.isCorrect,
      explanation: question.explanation,
    };
  }

  private validateContent(variant: LearningReadingVariant) {
    if (
      !variant.readingTitle.trim() ||
      !variant.readingParagraphs.length ||
      variant.readingParagraphs.some((paragraph) => !paragraph.trim()) ||
      !variant.questions.length
    )
      throw new Error('Published reading content is incomplete.');
    for (const question of variant.questions) {
      if (
        !question.prompt.trim() ||
        !question.explanation.trim() ||
        question.options.length < MIN_READING_OPTIONS ||
        question.options.filter((option) => option.isCorrect).length !== 1 ||
        question.options.some((option) => !option.text.trim())
      )
        throw new Error('Published reading question is invalid.');
    }
  }
}
