import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';
import request from 'supertest';
import Ajv, { type ValidateFunction } from 'ajv';
import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { PrismaService } from '../prisma/prisma.service';
import { VocabularyPracticeService } from './vocabulary/vocabulary-practice.service';
import { createPracticeStage } from './vocabulary/testing/fixtures';
import type { VocabularyLevel } from '../generated/prisma/enums';
import { exportOpenApi } from '../openapi/export-openapi';
import { LearningController } from './learning.controller';
import { LearningCatalogueService } from './catalogue/learning-catalogue.service';
import { LearningLessonService } from './lessons/learning-lesson.service';
import { LearningReadingService } from './reading/learning-reading.service';
import {
  createLessons,
  createTopics,
  createVariant,
  A2_VARIANT_ID,
  B2_VARIANT_ID,
} from './testing/learningDatabaseFixtures';

describe('Unified thematic lessons (HTTP)', () => {
  let app: INestApplication<Server>;
  let authorization: string;
  let topics: jest.Mock;
  let lessons: jest.Mock;
  let variant: jest.Mock;
  const validators = new Map<string, ValidateFunction<unknown>>();

  beforeAll(async () => {
    const document = await exportOpenApi();
    expect(
      document.paths['/learning/lessons/{slug}/questions/{questionId}/check']
        ?.post?.operationId,
    ).toBe('checkReadingAnswer');
    const ajv = new Ajv({ strict: false });
    ajv.addFormat('uuid', /^[0-9a-f-]{36}$/i);
    ajv.addFormat('uri', {
      type: 'string',
      validate: (value) => URL.canParse(value),
    });
    ajv.addSchema(document, 'learning');
    for (const name of [
      'GetLearningCatalogueResponse',
      'GetLearningLessonResponse',
      'CheckReadingAnswerResponse',
      'CheckVocabularyAnswerResponse',
    ])
      validators.set(
        name,
        ajv.compile({ $ref: `learning#/components/schemas/${name}` }),
      );
  });

  beforeEach(async () => {
    topics = jest.fn().mockResolvedValue(createTopics());
    lessons = jest.fn().mockResolvedValue(createLessons());
    variant = jest
      .fn()
      .mockImplementation(({ where }: { where: { level: VocabularyLevel } }) =>
        Promise.resolve(
          where.level === 'A2' || where.level === 'B2'
            ? createVariant(where.level)
            : null,
        ),
      );
    const vocabularyStage = createPracticeStage('practise-all', B2_VARIANT_ID);
    const otherLevelStage = createPracticeStage('practise-all', A2_VARIANT_ID);
    const readStages = ({ where }: { where: { variantId: string } }) => {
      const stage =
        where.variantId === B2_VARIANT_ID ? vocabularyStage : otherLevelStage;
      return [{ ...stage, id: 'learn', kind: 'learn', exercises: [] }, stage];
    };
    const exerciseRead = jest
      .fn()
      .mockImplementation(
        ({ where }: { where: { id: string; variantId: string } }) =>
          where.variantId === B2_VARIANT_ID
            ? (vocabularyStage.exercises.find(({ id }) => id === where.id) ??
              null)
            : null,
      );
    const module = await Test.createTestingModule({
      controllers: [LearningController],
      providers: [
        LearningCatalogueService,
        LearningLessonService,
        LearningReadingService,
        VocabularyPracticeService,
        JwtService,
        UserAuthGuard,
        {
          provide: PrismaService,
          useValue: {
            learningTopic: { findMany: topics },
            learningLesson: { findMany: lessons },
            learningLessonVariant: { findFirst: variant },
            vocabularyLessonStage: { findMany: readStages },
            vocabularyExercise: { findFirst: exerciseRead },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
      bodyParser: false,
    });
    configureApiBoundaries(app);
    await app.init();
    authorization = `Bearer ${module.get(JwtService).issueAccessToken({ id: '44444444-4444-4444-8444-444444444444', email: 'reader@example.test', createdAt: '2026-11-18T00:00:00Z', balance: 0, lessonsCompleted: 0, testsCompleted: 0, wordsLearned: 0 }).accessToken}`;
  });
  afterEach(async () => {
    await app.close();
  });
  function expectSchema(name: string, body: unknown) {
    const validate = validators.get(name);
    if (!validate || !validate(body))
      throw new Error(JSON.stringify(validate?.errors));
  }

  it('lists each root topic once with levels aggregated from nested lessons', async () => {
    const response = await request(app.getHttpServer())
      .get('/learning/catalogue?locale=uk')
      .set('Authorization', authorization)
      .expect(200);
    const body: unknown = response.body;
    expect(body).toHaveProperty('topic', null);
    expect(body).toHaveProperty('topics', [
      {
        slug: 'germany',
        coverImageUrl:
          '/learning/media?key=learning%2Ftopics%2Fgermany%2Fcatalogue%2Fv1.webp',
        title: 'Німеччина',
        description: 'Досліджуйте Німеччину',
        availableLevels: ['A2', 'B2'],
      },
    ]);
    expect(body).toHaveProperty('lessons', []);
    expect(body).toHaveProperty('supportedLevels', ['A1', 'A2', 'B1', 'B2']);
    expectSchema('GetLearningCatalogueResponse', body);
  });
  it('browses direct children and falls back only between interface locales', async () => {
    const response = await request(app.getHttpServer())
      .get('/learning/catalogue?topic=festivals&locale=uk')
      .set('Authorization', authorization)
      .expect(200);
    const body: unknown = response.body;
    expect(body).toHaveProperty('topic.slug', 'festivals');
    expect(body).toHaveProperty('topic.title', 'Festivals');
    expect(body).toHaveProperty('lessons', [
      expect.objectContaining({
        availableLevels: ['A2', 'B2'],
        thumbnailUrl:
          '/learning/media?key=learning%2Flessons%2Foktoberfest%2Freading%2Fv1.png',
      }),
    ]);
    expectSchema('GetLearningCatalogueResponse', body);
  });
  it.each(['A2', 'B2'])(
    'returns matching vocabulary and prepared text at %s without answer keys',
    async (level) => {
      const response = await request(app.getHttpServer())
        .get(`/learning/lessons/oktoberfest?level=${level}`)
        .set('Authorization', authorization)
        .expect(200);
      const body: unknown = response.body;
      expect(body).toHaveProperty('slug', 'oktoberfest');
      expect(body).toMatchObject({
        readingImageUrl:
          '/learning/media?key=learning%2Flessons%2Foktoberfest%2Freading%2Fv1.png',
        readingCheckImageUrl:
          '/learning/media?key=learning%2Fart%2Freading-check%2Fv1.png',
        resultsImageUrl:
          '/learning/media?key=learning%2Flessons%2Foktoberfest%2Fquestions%2Fv1.png',
      });
      expect(body).not.toHaveProperty('coverImageKey');
      expect(body).toHaveProperty('variant.level', level);
      expect(body).toHaveProperty('variant.vocabulary.words.0.id', 'book');
      expect(body).toHaveProperty(
        'variant.vocabulary.words.0.imageUrl',
        '/learning/media?key=vocabulary%2Ftest%2Fbook%2Fv1.png',
      );
      expect(body).toHaveProperty('variant.vocabulary.words.1.imageUrl', null);
      expect(body).toHaveProperty(
        'variant.vocabulary.questions.0.options.0.imageUrl',
        '/learning/media?key=vocabulary%2Ftest%2Fbook%2Fv1.png',
      );
      expect(body).toHaveProperty(
        'variant.vocabulary.questions.0.id',
        'question-1',
      );
      expect(body).toHaveProperty(
        'variant.vocabulary.questions.2.kind',
        'sentence_gap',
      );
      expect(body).not.toHaveProperty('variant.vocabulary.slug');
      expect(body).toHaveProperty('variant.readingTitle', `Reading ${level}`);
      expect(body).toHaveProperty('variant.questions.0', {
        id: 'rain',
        prompt: 'What is the weather like?',
        options: [
          { id: 'rainy', text: 'Rainy' },
          { id: 'sunny', text: 'Sunny' },
        ],
      });
      expect(JSON.stringify(body)).not.toMatch(
        /isCorrect|explanation|publishedAt|correctWordId|correctOptionId|sentenceTranslationUk/,
      );
      expectSchema('GetLearningLessonResponse', body);
    },
  );
  it('checks vocabulary answers against the requested thematic variant', async () => {
    const path =
      '/learning/lessons/oktoberfest/vocabulary/exercises/question-3/check';
    const response = await request(app.getHttpServer())
      .post(`${path}?level=B2`)
      .set('Authorization', authorization)
      .send({ optionId: 'pencil' })
      .expect(200);

    expect(response.body).toMatchObject({
      questionId: 'question-3',
      selectedOptionId: 'pencil',
      correctOptionId: 'book',
      isCorrect: false,
      word: {
        imageUrl: '/learning/media?key=vocabulary%2Ftest%2Fbook%2Fv1.png',
      },
      sentenceTranslationUk: 'У мене є книга.',
    });
    expectSchema('CheckVocabularyAnswerResponse', response.body);
    await request(app.getHttpServer())
      .post(`${path}?level=A2`)
      .set('Authorization', authorization)
      .send({ optionId: 'pencil' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`${path}?level=B2`)
      .set('Authorization', authorization)
      .send({ optionId: 'foreign-word' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`${path}?level=B2`)
      .send({ optionId: 'pencil' })
      .expect(401);
  });

  it('reports an unavailable level as null instead of substituting another level', async () => {
    const response = await request(app.getHttpServer())
      .get('/learning/lessons/oktoberfest?level=C1')
      .set('Authorization', authorization)
      .expect(200);
    const body: unknown = response.body;
    expect(body).toHaveProperty('variant', null);
    expect(body).toHaveProperty('availableLevels', ['A2', 'B2']);
    expectSchema('GetLearningLessonResponse', body);
  });
  it.each([
    '',
    '?level=invalid',
    '?level=A2&level=B2',
    '?level=A2&locale=de',
    '?level=A2&unknown=yes',
  ])('rejects invalid lesson query %s', async (query) => {
    const response = await request(app.getHttpServer())
      .get(`/learning/lessons/oktoberfest${query}`)
      .set('Authorization', authorization)
      .expect(400);
    expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
  });
  it.each(['/learning/catalogue', '/learning/lessons/oktoberfest?level=A2'])(
    'protects %s',
    async (path) => {
      await request(app.getHttpServer()).get(path).expect(401);
    },
  );
  it('protects answer checks', async () => {
    await request(app.getHttpServer())
      .post('/learning/lessons/oktoberfest/questions/rain/check?level=A2')
      .send({ optionId: 'rainy' })
      .expect(401);
  });
  it('hides descendants of unpublished ancestors and missing topics', async () => {
    topics.mockResolvedValue(createTopics().slice(1));
    await request(app.getHttpServer())
      .get('/learning/catalogue?topic=festivals')
      .set('Authorization', authorization)
      .expect(404);
    await request(app.getHttpServer())
      .get('/learning/lessons/oktoberfest?level=A2')
      .set('Authorization', authorization)
      .expect(404);
    await request(app.getHttpServer())
      .post('/learning/lessons/oktoberfest/questions/rain/check?level=B2')
      .set('Authorization', authorization)
      .send({ optionId: 'rainy' })
      .expect(404);
    await request(app.getHttpServer())
      .post(
        '/learning/lessons/oktoberfest/vocabulary/exercises/question-3/check?level=B2',
      )
      .set('Authorization', authorization)
      .send({ optionId: 'pencil' })
      .expect(404);
    expect(variant).not.toHaveBeenCalled();
  });
  it.each([
    ['rainy', true],
    ['sunny', false],
  ])(
    'checks %s against the selected level without writes',
    async (optionId, isCorrect) => {
      const path =
        '/learning/lessons/oktoberfest/questions/rain/check?level=B2';
      const first = await request(app.getHttpServer())
        .post(path)
        .set('Authorization', authorization)
        .send({ optionId })
        .expect(200);
      expect(first.body).toEqual({
        questionId: 'rain',
        selectedOptionId: optionId,
        correctOptionId: 'rainy',
        isCorrect,
        explanation: 'The text says that it is raining.',
      });
      const retry = await request(app.getHttpServer())
        .post(path)
        .set('Authorization', authorization)
        .send({ optionId })
        .expect(200);
      expect(retry.body).toEqual(first.body);
      expectSchema('CheckReadingAnswerResponse', first.body);
    },
  );
  it('rejects unrelated questions, options, missing variants and extra fields', async () => {
    await request(app.getHttpServer())
      .post('/learning/lessons/oktoberfest/questions/missing/check?level=A2')
      .set('Authorization', authorization)
      .send({ optionId: 'rainy' })
      .expect(404);
    const bad = await request(app.getHttpServer())
      .post('/learning/lessons/oktoberfest/questions/rain/check?level=A2')
      .set('Authorization', authorization)
      .send({ optionId: 'other-question-choice' })
      .expect(400);
    expect(bad.body).toHaveProperty('code', 'LEARNING_OPTION_NOT_AVAILABLE');
    await request(app.getHttpServer())
      .post('/learning/lessons/oktoberfest/questions/rain/check?level=C1')
      .set('Authorization', authorization)
      .send({ optionId: 'rainy' })
      .expect(404);
    await request(app.getHttpServer())
      .post('/learning/lessons/oktoberfest/questions/rain/check?level=A2')
      .set('Authorization', authorization)
      .send({ optionId: 'rainy', score: 100 })
      .expect(400);
  });
  it('does not expose malformed published answer sets', async () => {
    const invalid = createVariant();
    invalid.questions[0]?.options.forEach((option) => {
      option.isCorrect = true;
    });
    variant.mockResolvedValue(invalid);
    await request(app.getHttpServer())
      .get('/learning/lessons/oktoberfest?level=A2')
      .set('Authorization', authorization)
      .expect(500);
  });
});
