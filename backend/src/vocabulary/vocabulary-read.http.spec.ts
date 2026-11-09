import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';
import request from 'supertest';
import Ajv, { type ValidateFunction } from 'ajv';
import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { PrismaService } from '../prisma/prisma.service';
import { exportOpenApi } from '../openapi/export-openapi';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

const LESSON_ID = '91a160f2-8ae8-49dc-b105-3572ca4d7610';
const EXPIRED_TOKEN_AGE_MS = 60 * 60 * 1000;
const paths = ['/vocabulary/lessons', '/vocabulary/lessons/common-things'];

function createLesson() {
  return {
    id: LESSON_ID,
    slug: 'common-things',
    level: 'A1',
    publishedAt: new Date('2026-11-09T00:00:00Z'),
    createdAt: new Date('2026-11-08T00:00:00Z'),
    translations: [
      { locale: 'en', title: 'Common Things', description: 'Everyday objects' },
      {
        locale: 'uk',
        title: 'Звичайні речі',
        description: 'Повсякденні предмети',
      },
    ],
    _count: { words: 1, stages: 1 },
    words: [
      {
        lessonId: LESSON_ID,
        id: 'book',
        word: 'book',
        transcription: '/bʊk/',
        translationUk: 'книга',
        example: 'This is a book.',
        exampleTranslationUk: 'Це книга.',
        imageKey: 'vocabulary/book/v1.svg',
        imageSourceUrl: 'https://example.test/book',
        imageLicense: 'CC BY 4.0',
        imageAttribution: 'Sample artist',
      },
    ],
    stages: [
      {
        lessonId: LESSON_ID,
        id: 'learn-first',
        position: 0,
        kind: 'learn',
        translations: [
          { locale: 'en', title: 'Learn', description: 'Read the cards' },
        ],
        words: [{ wordId: 'book', position: 0 }],
        _count: { exercises: 0 },
        exercises: [{ correctWordId: 'book' }],
      },
    ],
  };
}

describe('Vocabulary catalogue and word cards (HTTP)', () => {
  let app: INestApplication<Server>;
  let authorization: string;
  let jwt: JwtService;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  const validators = new Map<string, ValidateFunction<unknown>>();

  beforeAll(async () => {
    const document = await exportOpenApi();
    const ajv = new Ajv({ strict: false, allErrors: true });
    ajv.addFormat(
      'uuid',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    ajv.addFormat('uri', {
      type: 'string',
      validate: (value) => URL.canParse(value),
    });
    ajv.addSchema(document, 'vocabulary');
    for (const path of ['/vocabulary/lessons', '/vocabulary/lessons/{slug}']) {
      for (const status of ['200', '400', '401', '404', '500']) {
        if (!document.paths[path]?.get?.responses[status]) continue;
        validators.set(
          `${path}:${status}`,
          ajv.compile<unknown>({
            $ref: `vocabulary#/paths/${path.replaceAll('/', '~1')}/get/responses/${status}/content/application~1json/schema`,
          }),
        );
      }
    }
  });

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([createLesson()]);
    findFirst = jest.fn().mockResolvedValue(createLesson());
    const module = await Test.createTestingModule({
      controllers: [VocabularyController],
      providers: [
        VocabularyService,
        JwtService,
        UserAuthGuard,
        {
          provide: PrismaService,
          useValue: { vocabularyLesson: { findMany, findFirst } },
        },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
      bodyParser: false,
    });
    configureApiBoundaries(app);
    await app.init();
    jwt = module.get(JwtService);
    authorization = `Bearer ${
      jwt.issueAccessToken({
        id: '11111111-1111-4111-8111-111111111111',
        email: 'reader@example.test',
        createdAt: '2026-11-09T00:00:00Z',
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      }).accessToken
    }`;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  function expectContract(path: string, status: number, body: unknown) {
    const schemaPath = path === paths[0] ? path : '/vocabulary/lessons/{slug}';
    const validate = validators.get(`${schemaPath}:${status}`);
    if (!validate || !validate(body))
      throw new Error(
        `Undocumented response: ${JSON.stringify(validate?.errors)}`,
      );
  }

  it('serializes localized catalogue summaries without storage fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/vocabulary/lessons?locale=uk')
      .set('Authorization', authorization)
      .expect(200);
    expect(response.body).toEqual({
      lessons: [
        {
          id: LESSON_ID,
          slug: 'common-things',
          level: 'A1',
          title: 'Звичайні речі',
          description: 'Повсякденні предмети',
          wordCount: 1,
          stageCount: 1,
        },
      ],
    });
    expectContract(paths[0], response.status, response.body);
  });

  it('returns word cards, attribution and stage rosters with English translation fallback', async () => {
    const response = await request(app.getHttpServer())
      .get(`${paths[1]}?locale=uk`)
      .set('Authorization', authorization)
      .expect(200);
    expect(response.body).toEqual({
      id: LESSON_ID,
      slug: 'common-things',
      level: 'A1',
      title: 'Звичайні речі',
      description: 'Повсякденні предмети',
      wordCount: 1,
      stageCount: 1,
      words: [
        {
          id: 'book',
          word: 'book',
          transcription: '/bʊk/',
          translationUk: 'книга',
          example: 'This is a book.',
          exampleTranslationUk: 'Це книга.',
          imageKey: 'vocabulary/book/v1.svg',
          imageSourceUrl: 'https://example.test/book',
          imageLicense: 'CC BY 4.0',
          imageAttribution: 'Sample artist',
        },
      ],
      stages: [
        {
          id: 'learn-first',
          position: 0,
          kind: 'learn',
          title: 'Learn',
          description: 'Read the cards',
          wordIds: ['book'],
          exerciseCount: 0,
        },
      ],
    });
    expectContract(paths[1], response.status, response.body);
  });

  it('defaults locale to English and supports an empty catalogue', async () => {
    const first = await request(app.getHttpServer())
      .get(paths[0])
      .set('Authorization', authorization)
      .expect(200);
    expect(first.body).toHaveProperty('lessons.0.title', 'Common Things');
    findMany.mockResolvedValue([]);
    const empty = await request(app.getHttpServer())
      .get(paths[0])
      .set('Authorization', authorization)
      .expect(200, { lessons: [] });
    expectContract(paths[0], empty.status, empty.body);
  });

  it('returns the same 404 for unavailable lesson slugs', async () => {
    findFirst.mockResolvedValue(null);
    const response = await request(app.getHttpServer())
      .get(paths[1])
      .set('Authorization', authorization)
      .expect(404, {
        statusCode: 404,
        code: 'VOCABULARY_LESSON_NOT_FOUND',
        message: 'Vocabulary lesson not found.',
      });
    expectContract(paths[1], response.status, response.body);
  });

  it.each(paths)(
    'rejects unsupported, repeated and unknown query fields on %s',
    async (path) => {
      for (const query of [
        'locale=fr',
        'locale=en&locale=uk',
        'includeDrafts=true',
      ]) {
        const response = await request(app.getHttpServer())
          .get(`${path}?${query}`)
          .set('Authorization', authorization)
          .expect(400);
        expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
        expectContract(path, response.status, response.body);
      }
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
    },
  );

  it.each(paths)(
    'requires valid nonexpired authentication on %s',
    async (path) => {
      const clock = jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() + EXPIRED_TOKEN_AGE_MS);
      const expired = authorization;
      for (const token of ['', 'Bearer invalid', expired]) {
        const response = await request(app.getHttpServer())
          .get(path)
          .set('Authorization', token)
          .expect(401);
        expectContract(path, response.status, response.body);
      }
      clock.mockRestore();
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
    },
  );

  it('fails safely when stored content lacks the requested and fallback translation', async () => {
    const lesson = createLesson();
    lesson.translations = [];
    findFirst.mockResolvedValue(lesson);
    const response = await request(app.getHttpServer())
      .get(paths[1])
      .set('Authorization', authorization)
      .expect(500);
    expect(response.body).toHaveProperty('code', 'INTERNAL_ERROR');
    expectContract(paths[1], response.status, response.body);
  });
});
