import Ajv from 'ajv';

import { exportOpenApi } from '../openapi/export-openapi';

const routes = [
  {
    path: '/articles',
    method: 'get',
    id: 'getWikipediaArticles',
    status: '200',
    protected: false,
  },
  {
    path: '/articles/random',
    method: 'get',
    id: 'getRandomWikipediaArticles',
    status: '200',
    protected: false,
  },
  {
    path: '/articles/{id}',
    method: 'get',
    id: 'getWikipediaArticleDetail',
    status: '200',
    protected: false,
  },
  {
    path: '/api/articles/adaptations',
    method: 'get',
    id: 'getArticleAdaptations',
    status: '200',
    protected: false,
  },
  {
    path: '/api/articles/simplify',
    method: 'post',
    id: 'simplifyArticle',
    status: '201',
    protected: false,
  },
  {
    path: '/api/articles/quiz',
    method: 'post',
    id: 'generateArticleQuiz',
    status: '201',
    protected: true,
  },
  {
    path: '/api/articles/vocabulary-quiz',
    method: 'post',
    id: 'generateArticleVocabularyQuiz',
    status: '201',
    protected: true,
  },
  {
    path: '/api/users/me/articles/saved',
    method: 'get',
    id: 'getSavedArticles',
    status: '200',
    protected: true,
  },
  {
    path: '/api/users/me/articles/saved',
    method: 'post',
    id: 'saveArticleForLater',
    status: '201',
    protected: true,
  },
  {
    path: '/api/users/me/articles/saved/{articleId}',
    method: 'delete',
    id: 'removeSavedArticle',
    status: '200',
    protected: true,
  },
  {
    path: '/api/users/me/articles/recent',
    method: 'get',
    id: 'getRecentArticles',
    status: '200',
    protected: true,
  },
  {
    path: '/api/users/me/articles/recent',
    method: 'post',
    id: 'recordRecentArticle',
    status: '201',
    protected: true,
  },
] as const;

describe('Articles OpenAPI metadata', () => {
  it('preserves all twelve routes, public/owner boundaries and success statuses', async () => {
    const document = await exportOpenApi();
    for (const route of routes) {
      const operation = document.paths[route.path]?.[route.method];
      expect(operation?.operationId).toBe(route.id);
      expect(operation?.security).toEqual(
        route.protected ? [{ bearer: [] }] : [],
      );
      expect(operation?.responses).toHaveProperty(route.status);
      if (route.protected) expect(operation?.responses).toHaveProperty('401');
      else expect(operation?.responses).not.toHaveProperty('401');
    }
    for (const [path, name] of [
      ['/articles', 'excludeIds'],
      ['/api/articles/adaptations', 'articleIds'],
    ]) {
      expect(document.paths[path]?.get?.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            in: 'query',
            name,
            style: 'form',
            explode: false,
          }),
        ]),
      );
    }
    expect(document.paths['/articles/{id}']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer', minimum: 1 },
        }),
        expect.objectContaining({
          in: 'query',
          name: 'languageCode',
          required: false,
          schema: { type: 'string', enum: ['en'], default: 'en' },
        }),
      ]),
    );
  });

  it('models nullable optional bodies without weakening required response enums', async () => {
    const document = await exportOpenApi();
    const validator = new Ajv({ strict: false, allErrors: true });
    validator.addSchema(document, 'articles');
    const simplify = validator.compile({
      $ref: 'articles#/components/schemas/SimplifyArticleRequest',
    });
    expect(
      simplify({
        text: 'Space',
        articleId: null,
        blocks: null,
        level: null,
        title: null,
        transformationType: null,
      }),
    ).toBe(true);
    expect(
      simplify({ text: 'Space', blocks: [null, 42, { unknown: 'value' }] }),
    ).toBe(true);
    expect(simplify({ text: 'Space', level: 'invalid' })).toBe(false);
    expect(simplify({ text: 'Space', unexpected: true })).toBe(false);
    const vocabulary = validator.compile({
      $ref: 'articles#/components/schemas/GenerateArticleVocabularyQuizRequest',
    });
    expect(vocabulary({ text: 'Space', level: null, title: null })).toBe(true);
    const level = validator.compile({
      $ref: 'articles#/components/schemas/ArticleSimplificationLevel',
    });
    expect(level('C1')).toBe(true);
    expect(level(null)).toBe(false);
  });

  it('keeps discriminants literal and separates session questions from answer-bearing questions', async () => {
    const document = await exportOpenApi();
    const schemas = document.components?.schemas;
    expect(schemas?.ArticleBlock).toMatchObject({
      discriminator: {
        propertyName: 'type',
        mapping: {
          heading: '#/components/schemas/ArticleHeadingBlock',
          formula: '#/components/schemas/FormulaBlock',
        },
      },
    });
    expect(schemas?.ArticleHeadingBlock).toMatchObject({
      properties: { type: { enum: ['heading'] } },
    });
    expect(schemas?.ArticleVocabularyQuizQuestion).toMatchObject({
      properties: { type: { enum: ['single_choice'] } },
    });
    for (const name of [
      'ArticleQuizQuestion',
      'ArticleVocabularyQuizQuestion',
    ]) {
      for (const hidden of [
        'correctOptionIds',
        'explanation',
        'term',
        'translation',
        'sourceExcerpt',
      ]) {
        expect(schemas?.[name]).not.toHaveProperty('properties.' + hidden);
      }
    }
    expect(schemas?.ArticleQuizAnswerKeyQuestion).toHaveProperty(
      'required',
      expect.arrayContaining(['correctOptionIds']),
    );
    expect(schemas?.UserSavedArticle).toMatchObject({
      properties: {
        savedAt: { type: 'string', format: 'date-time' },
        thumbnailUrl: { type: 'string' },
      },
    });
    expect(schemas?.UserSavedArticle).not.toHaveProperty(
      'properties.thumbnailUrl.nullable',
    );
  });
});
