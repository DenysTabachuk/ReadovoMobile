import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DictionaryRepository } from './dictionary.repository';
import {
  type CreateDictionaryWordRequest,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryTestQuestion,
  type DictionaryWord,
  type QuizOptionsRequest,
  type SimilarWordsRequest,
  type SubmitDictionaryTestAnswerRequest,
  type UpdateDictionaryWordProgressRequest,
} from './types';
import { DictionaryEmbeddingService } from './dictionary-embedding.service';

const DEFAULT_DICTIONARY_TEST_LIMIT = 10;
const DICTIONARY_TEST_OPTION_COUNT = 4;
export const REQUIRED_CORRECT_ANSWERS_TO_LEARN = 5;

@Injectable()
export class DictionaryService {
  constructor(
    private readonly dictionaryEmbeddingService: DictionaryEmbeddingService,
    private readonly dictionaryRepository: DictionaryRepository,
  ) {}

  async createWord(
    userId: string,
    request: CreateDictionaryWordRequest,
  ): Promise<DictionaryWord> {
    const word = request.word?.trim();
    const translation = request.translation?.trim();
    const context = request.context?.trim();

    if (!word) {
      throw new BadRequestException('Word is required.');
    }

    if (!translation) {
      throw new BadRequestException('Translation is required.');
    }

    if (!context) {
      throw new BadRequestException('Context is required.');
    }

    return this.dictionaryRepository.createOrUpdate({
      context,
      createdAt: new Date().toISOString(),
      correctAnswersCount: 0,
      id: randomUUID(),
      progress: 'new',
      requiredCorrectAnswers: REQUIRED_CORRECT_ANSWERS_TO_LEARN,
      translation,
      userId,
      word,
    });
  }

  findAll(userId: string): Promise<DictionaryWord[]> {
    return this.dictionaryRepository.findAll(userId);
  }

  generateEmbedding(text: string): Promise<number[]> {
    return this.dictionaryEmbeddingService.generateEmbedding(text);
  }

  async getSimilarWords(request: SimilarWordsRequest): Promise<string[]> {
    const wordList = await this.resolveWordList(request.wordList);

    return this.dictionaryEmbeddingService.getSimilarWords(
      request.word ?? '',
      wordList,
    );
  }

  async generateQuizOptions(request: QuizOptionsRequest): Promise<string[]> {
    const wordList = await this.resolveWordList(request.wordList);

    return this.dictionaryEmbeddingService.generateQuizOptions(
      request.correctWord ?? '',
      wordList,
    );
  }

  async createTest(
    userId: string,
    limit = DEFAULT_DICTIONARY_TEST_LIMIT,
  ): Promise<DictionaryTest> {
    const normalizedLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(DEFAULT_DICTIONARY_TEST_LIMIT, Math.floor(limit)))
      : DEFAULT_DICTIONARY_TEST_LIMIT;
    const words = await this.dictionaryRepository.findAll(userId);

    if (words.length < DICTIONARY_TEST_OPTION_COUNT) {
      throw new BadRequestException(
        'At least 4 dictionary words are required to create a test.',
      );
    }

    const reviewCandidates =
      await this.dictionaryRepository.findReviewCandidates(userId, normalizedLimit);
    const questions = await Promise.all(
      reviewCandidates.map((word) => this.createTestQuestion(word, words)),
    );

    return { questions };
  }

  async submitTestAnswer(
    userId: string,
    request: SubmitDictionaryTestAnswerRequest,
  ): Promise<DictionaryTestAnswerResult> {
    const wordId = request.wordId?.trim();
    const selectedOptionId = request.selectedOptionId?.trim();

    if (!wordId) {
      throw new BadRequestException('Word id is required.');
    }

    if (!selectedOptionId) {
      throw new BadRequestException('Selected option id is required.');
    }

    const word = await this.dictionaryRepository.findById(wordId, userId);

    if (!word) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    const isCorrect = selectedOptionId === word.id;
    const nextReviewProgress = this.getNextReviewProgress(
      word.correctAnswersCount,
      word.progress,
      isCorrect,
    );
    const reviewedWord = await this.dictionaryRepository.updateReviewResult(
      word.id,
      userId,
      nextReviewProgress.progress,
      nextReviewProgress.correctAnswersCount,
      new Date().toISOString(),
    );

    if (!reviewedWord) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    return {
      correctOptionId: word.id,
      correctTranslation: word.translation,
      isCorrect,
      word: reviewedWord,
    };
  }

  async updateWordProgress(
    userId: string,
    wordId: string,
    request: UpdateDictionaryWordProgressRequest,
  ): Promise<DictionaryWord> {
    const progress = request.progress;

    if (progress !== 'in_progress') {
      throw new BadRequestException(
        'Only in_progress status can be set manually.',
      );
    }

    const word = await this.dictionaryRepository.findById(wordId, userId);

    if (!word) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    const updatedWord = await this.dictionaryRepository.updateProgress(
      word.id,
      userId,
      progress,
      Math.min(word.correctAnswersCount, REQUIRED_CORRECT_ANSWERS_TO_LEARN - 1),
    );

    if (!updatedWord) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    return updatedWord;
  }

  private async resolveWordList(wordList?: string[]): Promise<string[]> {
    if (wordList?.length) {
      return wordList;
    }

    return [];
  }

  private async createTestQuestion(
    word: DictionaryWord,
    words: DictionaryWord[],
  ): Promise<DictionaryTestQuestion> {
    const wordByNormalizedText = new Map(
      words.map((dictionaryWord) => [
        this.normalizeWord(dictionaryWord.word),
        dictionaryWord,
      ]),
    );
    const candidateWords = words.filter(
      (candidateWord) => candidateWord.id !== word.id,
    );
    const similarWords = await this.dictionaryEmbeddingService.getSimilarWords(
      word.word,
      candidateWords.map((candidateWord) => candidateWord.word),
    );
    const distractors = similarWords
      .map((similarWord) => wordByNormalizedText.get(similarWord))
      .filter((candidateWord): candidateWord is DictionaryWord =>
        Boolean(candidateWord),
      );
    const distractorIds = new Set(
      distractors.map((distractor) => distractor.id),
    );
    const fallbackDistractors = candidateWords.filter(
      (candidateWord) => !distractorIds.has(candidateWord.id),
    );
    const selectedDistractors = [...distractors, ...fallbackDistractors].slice(
      0,
      DICTIONARY_TEST_OPTION_COUNT - 1,
    );

    return {
      options: this.shuffleWords([word, ...selectedDistractors]).map(
        (option) => ({
          id: option.id,
          translation: option.translation,
        }),
      ),
      word: word.word,
      wordId: word.id,
    };
  }

  private getNextReviewProgress(
    currentCorrectAnswersCount: number,
    currentProgress: DictionaryWord['progress'],
    isCorrect: boolean,
  ): Pick<DictionaryWord, 'correctAnswersCount' | 'progress'> {
    if (!isCorrect) {
      const correctAnswersCount =
        currentProgress === 'learned'
          ? REQUIRED_CORRECT_ANSWERS_TO_LEARN - 1
          : currentCorrectAnswersCount;

      return {
        correctAnswersCount,
        progress: 'in_progress',
      };
    }

    const correctAnswersCount = Math.min(
      currentCorrectAnswersCount + 1,
      REQUIRED_CORRECT_ANSWERS_TO_LEARN,
    );

    return {
      correctAnswersCount,
      progress:
        correctAnswersCount >= REQUIRED_CORRECT_ANSWERS_TO_LEARN
          ? 'learned'
          : 'in_progress',
    };
  }

  private normalizeWord(word: string): string {
    return word.trim().toLowerCase();
  }

  private shuffleWords<T>(words: T[]): T[] {
    return [...words].sort(() => Math.random() - 0.5);
  }
}
