import { QuizService } from '../../quiz/quiz.service';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { DictionaryEmbeddingService } from '../dictionary-embedding.service';
import { DictionaryController } from '../dictionary.controller';
import { DictionaryRepository } from '../dictionary.repository';
import { DictionaryService } from '../dictionary.service';
import { type DictionaryWord } from '../types';

type EmbeddingTestDependency =
  | Pick<
      DictionaryEmbeddingService,
      'generateEmbedding' | 'getSimilarWords' | 'generateQuizOptions'
    >
  | Record<string, never>;

export const DICTIONARY_TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const DICTIONARY_TEST_WORD_ID = '22222222-2222-4222-8222-222222222222';

/**
 * Creates a real dictionary HTTP app with fresh repository mocks.
 * @param embeddingService - Optional real embedding service for provider-boundary
 * tests; defaults to an unused stub for word/generation suites.
 * @returns The app/server, JWT header, word fixture and typed repository mocks.
 * A supplied embedding service runs its normal module lifecycle; callers must
 * replace its external model boundary to avoid downloading a live model.
 * Registers no hooks or globals; the caller must await app.close().
 * @example
 * const testApp = await createDictionaryHttpApp();
 * // With the empty repository, DELETE /api/dictionary/me/words/:wordId returns
 * // HTTP 404 with DICTIONARY_WORD_NOT_FOUND.
 * await testApp.app.close();
 */
export async function createDictionaryHttpApp(
  embeddingService: EmbeddingTestDependency = {},
) {
  const word: DictionaryWord = {
    id: DICTIONARY_TEST_WORD_ID,
    userId: DICTIONARY_TEST_USER_ID,
    context: 'An example in context.',
    word: 'example',
    translation: 'Translation',
    createdAt: '2026-10-28T12:00:00.000Z',
    progress: 'new',
    correctAnswersCount: 0,
    requiredCorrectAnswers: 5,
  };
  const repository: jest.Mocked<
    Pick<
      DictionaryRepository,
      | 'create'
      | 'findAll'
      | 'findById'
      | 'updateProgress'
      | 'deleteById'
      | 'findReviewCandidates'
    >
  > = {
    create: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(undefined),
    deleteById: jest.fn().mockResolvedValue(undefined),
    updateProgress: jest.fn().mockResolvedValue(undefined),
    findReviewCandidates: jest.fn().mockResolvedValue([]),
  };
  const module = await Test.createTestingModule({
    controllers: [DictionaryController],
    providers: [
      DictionaryService,
      {
        provide: QuizService,
        useValue: {
          create: jest
            .fn()
            .mockResolvedValue('33333333-3333-4333-8333-333333333333'),
        },
      },
      JwtService,
      UserAuthGuard,
      { provide: DictionaryRepository, useValue: repository },
      { provide: DictionaryEmbeddingService, useValue: embeddingService },
    ],
  }).compile();
  const app = module.createNestApplication<INestApplication<Server>>({
    bodyParser: false,
    logger: false,
  });
  configureApiBoundaries(app);
  try {
    await app.init();
  } catch (error) {
    await app.close();
    throw error;
  }
  const token = module.get(JwtService).issueAccessToken({
    id: DICTIONARY_TEST_USER_ID,
    email: 'reader@example.test',
    balance: 0,
    createdAt: word.createdAt,
    lessonsCompleted: 0,
    testsCompleted: 0,
    wordsLearned: 0,
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    authorization: `Bearer ${token}`,
    repository,
    word,
  };
}

export type DictionaryHttpTestApp = Awaited<
  ReturnType<typeof createDictionaryHttpApp>
>;
