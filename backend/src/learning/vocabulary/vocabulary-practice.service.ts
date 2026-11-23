import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  VocabularyLessonWord,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../../common/errors/api-exception';
import { LEARNING_ERRORS } from '../learning-errors';
import type { LearningVocabularyDto } from './dto/learning-vocabulary.dto';
import type { VocabularyLessonWordDto } from './dto/vocabulary-lesson-word.dto';
import type { CheckVocabularyAnswerResponseDto } from './dto/check-vocabulary-answer-response.dto';

type PracticeExercise = Prisma.VocabularyExerciseGetPayload<{
  include: { options: { include: { word: true } }; correctWord: true };
}>;

const MIN_ANSWER_OPTIONS = 2;

@Injectable()
export class VocabularyPracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async getContent(variantId: string): Promise<LearningVocabularyDto> {
    const stages = await this.prisma.vocabularyLessonStage.findMany({
      where: { variantId },
      orderBy: { position: 'asc' },
      include: {
        words: { orderBy: { position: 'asc' }, include: { word: true } },
        exercises: {
          orderBy: { position: 'asc' },
          include: {
            correctWord: true,
            options: { orderBy: { position: 'asc' }, include: { word: true } },
          },
        },
      },
    });
    const words = new Map<string, VocabularyLessonWordDto>();
    const questions: LearningVocabularyDto['questions'] = [];
    for (const stage of stages) {
      if (stage.kind === 'learn') {
        for (const { word } of stage.words) {
          words.set(word.id, this.toWord(word));
        }
        continue;
      }
      if (stage.exercises.length === 0)
        throw new Error('Vocabulary practice is empty.');
      const roster = new Set(stage.words.map(({ wordId }) => wordId));
      for (const exercise of stage.exercises) {
        this.validateExercise(exercise, roster);
        questions.push({
          id: exercise.id,
          kind: exercise.kind,
          prompt:
            exercise.kind === 'sentence_gap' ? null : exercise.correctWord.word,
          sentenceBefore: exercise.sentenceBefore,
          sentenceAfter: exercise.sentenceAfter,
          options: exercise.options.map(({ wordId, word }) => ({
            id: wordId,
            word: word.word,
            imageKey: word.imageKey,
          })),
        });
      }
    }
    return { words: [...words.values()], questions };
  }

  async checkAnswer(
    variantId: string,
    exerciseId: string,
    optionId: string,
  ): Promise<CheckVocabularyAnswerResponseDto> {
    const exercise = await this.prisma.vocabularyExercise.findFirst({
      where: {
        id: exerciseId,
        variantId,
        stage: { kind: 'practice', variant: { publishedAt: { not: null } } },
      },
      include: {
        correctWord: true,
        options: { include: { word: true } },
        stage: { include: { words: true } },
      },
    });
    if (!exercise) throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    this.validateExercise(
      exercise,
      new Set(exercise.stage.words.map(({ wordId }) => wordId)),
    );
    if (!exercise.options.some(({ wordId }) => wordId === optionId))
      throw new ApiException(LEARNING_ERRORS.OPTION_NOT_AVAILABLE);
    return {
      questionId: exercise.id,
      selectedOptionId: optionId,
      correctOptionId: exercise.correctWordId,
      isCorrect: optionId === exercise.correctWordId,
      word: this.toWord(exercise.correctWord),
      sentenceTranslationUk: exercise.sentenceTranslationUk,
    };
  }

  private toWord(word: VocabularyLessonWord): VocabularyLessonWordDto {
    return {
      id: word.id,
      word: word.word,
      transcription: word.transcription,
      translationUk: word.translationUk,
      example: word.example,
      exampleTranslationUk: word.exampleTranslationUk,
      imageKey: word.imageKey,
      imageSourceUrl: word.imageSourceUrl,
      imageLicense: word.imageLicense,
      imageAttribution: word.imageAttribution,
    };
  }

  private validateExercise(exercise: PracticeExercise, roster: Set<string>) {
    if (
      exercise.options.length < MIN_ANSWER_OPTIONS ||
      !roster.has(exercise.correctWordId) ||
      !exercise.options.some(
        ({ wordId }) => wordId === exercise.correctWordId,
      ) ||
      exercise.options.some(({ wordId }) => !roster.has(wordId))
    )
      throw new Error('Invalid stored vocabulary choices.');
    if (exercise.kind === 'sentence_gap') {
      if (
        exercise.sentenceBefore === null ||
        exercise.sentenceAfter === null ||
        !exercise.sentenceTranslationUk?.trim() ||
        !(exercise.sentenceBefore + exercise.sentenceAfter).trim()
      )
        throw new Error('Invalid stored sentence gap.');
    } else if (
      exercise.sentenceBefore !== null ||
      exercise.sentenceAfter !== null ||
      exercise.sentenceTranslationUk !== null
    ) {
      throw new Error('Unexpected stored sentence fields.');
    }
  }
}
