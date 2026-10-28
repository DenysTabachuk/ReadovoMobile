import { Logger } from '@nestjs/common';
import request from 'supertest';

import {
  createDictionaryHttpApp,
  DICTIONARY_TEST_USER_ID,
  DICTIONARY_TEST_WORD_ID,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

const mockCompletion = jest.fn<
  Promise<{
    choices: { message: { content: string | null } }[];
  }>,
  [unknown, unknown]
>();

// Replace only the SDK boundary: controllers, services, parsing and filters stay real.
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: class {
    readonly chat = {
      completions: {
        create: (body: unknown, options: unknown) =>
          mockCompletion(body, options),
      },
    };
  },
}));

const path = '/api/dictionary/me/test';
const validQuestion = {
  wordId: DICTIONARY_TEST_WORD_ID,
  format: 'translation',
  distractors: ['wrong one', 'wrong two', 'wrong three'],
};

describe('Dictionary test generation (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;
  let previousApiKey: string | undefined;

  beforeEach(async () => {
    previousApiKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'dictionary-test-key';
    mockCompletion.mockReset();
    testApp = await createDictionaryHttpApp();
  });

  afterEach(async () => {
    await testApp.app.close();
    jest.restoreAllMocks();
    if (previousApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousApiKey;
  });

  it('rejects a dictionary without words before calling AI', async () => {
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'DICTIONARY_TEST_NO_WORDS',
        message: 'At least 1 dictionary word is required to create a test.',
      });
    expect(testApp.repository.findReviewCandidates).not.toHaveBeenCalled();
    expect(mockCompletion).not.toHaveBeenCalled();
  });

  it('rejects unavailable review candidates and preserves the default limit', async () => {
    testApp.repository.findAll.mockResolvedValue([testApp.word]);
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'DICTIONARY_TEST_NO_REVIEW_CANDIDATES',
        message: 'No dictionary words are available to create a test.',
      });
    expect(testApp.repository.findReviewCandidates).toHaveBeenCalledWith(
      DICTIONARY_TEST_USER_ID,
      10,
    );
    expect(mockCompletion).not.toHaveBeenCalled();
  });

  it.each(['0', '11', '1.5', 'invalid'])(
    'rejects invalid limit %s in the DTO',
    async (limit) => {
      const response = await request(testApp.server)
        .get(`${path}?limit=${limit}`)
        .set('Authorization', testApp.authorization)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: ['limit'] }] },
      });
      expect(testApp.repository.findAll).not.toHaveBeenCalled();
      expect(mockCompletion).not.toHaveBeenCalled();
    },
  );

  describe('Provider failures', () => {
    beforeEach(() => {
      testApp.repository.findAll.mockResolvedValue([testApp.word]);
      testApp.repository.findReviewCandidates.mockResolvedValue([testApp.word]);
    });

    it('does not expose missing provider configuration', async () => {
      delete process.env.GROQ_API_KEY;
      await request(testApp.server)
        .get(path)
        .set('Authorization', testApp.authorization)
        .expect(500, {
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'Internal server error.',
        });
      expect(mockCompletion).not.toHaveBeenCalled();
    });

    it('maps SDK errors without exposing or logging their payload', async () => {
      const log = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      mockCompletion.mockRejectedValue(
        new Error('secret-provider-credentials'),
      );
      await request(testApp.server)
        .get(path)
        .set('Authorization', testApp.authorization)
        .expect(502, {
          statusCode: 502,
          code: 'DICTIONARY_TEST_GENERATION_FAILED',
          message: 'Failed to generate dictionary test.',
        });
      expect(log).toHaveBeenCalledWith('Groq dictionary test request failed.');
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        'secret-provider-credentials',
      );
    });

    it.each([
      {
        name: 'empty response',
        content: '',
        code: 'DICTIONARY_TEST_GENERATION_EMPTY',
        message: 'Dictionary test generation was empty.',
      },
      {
        name: 'whitespace response',
        content: '  ',
        code: 'DICTIONARY_TEST_GENERATION_EMPTY',
        message: 'Dictionary test generation was empty.',
      },
      {
        name: 'invalid JSON',
        content: 'not-json',
        code: 'DICTIONARY_TEST_GENERATION_INVALID_RESPONSE',
        message: 'Dictionary test generation returned invalid JSON.',
      },
      {
        name: 'null JSON',
        content: 'null',
        code: 'DICTIONARY_TEST_GENERATION_INVALID_RESPONSE',
        message: 'Dictionary test generation returned invalid JSON.',
      },
      {
        name: 'primitive JSON',
        content: '42',
        code: 'DICTIONARY_TEST_GENERATION_INVALID_RESPONSE',
        message: 'Dictionary test generation returned invalid JSON.',
      },
      {
        name: 'non-array questions',
        content: '{"questions":{}}',
        code: 'DICTIONARY_TEST_GENERATION_INVALID_RESPONSE',
        message: 'Dictionary test generation returned invalid JSON.',
      },
      {
        name: 'missing questions',
        content: '{"questions":[]}',
        code: 'DICTIONARY_TEST_GENERATION_INCOMPLETE',
        message: 'Dictionary test generation returned incomplete questions.',
      },
      {
        name: 'malformed entries',
        content: '{"questions":[null,42,{}]}',
        code: 'DICTIONARY_TEST_GENERATION_INCOMPLETE',
        message: 'Dictionary test generation returned incomplete questions.',
      },
      {
        name: 'duplicate/correct distractors',
        content: JSON.stringify({
          questions: [
            { ...validQuestion, distractors: ['same', 'same', 'Translation'] },
          ],
        }),
        code: 'DICTIONARY_TEST_GENERATION_INCOMPLETE',
        message: 'Dictionary test generation returned incomplete questions.',
      },
    ])(
      'preserves the specific code through catch for $name',
      async ({ content, code, message }) => {
        mockCompletion.mockResolvedValue({
          choices: [{ message: { content } }],
        });
        await request(testApp.server)
          .get(path)
          .set('Authorization', testApp.authorization)
          .expect(502, { statusCode: 502, code, message });
      },
    );

    it('does not write raw AI output to warning logs', async () => {
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      mockCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  { ...validQuestion, wordId: 'secret-provider-response' },
                ],
              }),
            },
          },
        ],
      });
      await request(testApp.server)
        .get(path)
        .set('Authorization', testApp.authorization)
        .expect(502, {
          statusCode: 502,
          code: 'DICTIONARY_TEST_GENERATION_INCOMPLETE',
          message: 'Dictionary test generation returned incomplete questions.',
        });
      expect(warn).toHaveBeenCalled();
      expect(JSON.stringify(warn.mock.calls)).not.toContain(
        'secret-provider-response',
      );
    });
  });

  it.each([
    { name: 'JSON', prefix: '', suffix: '' },
    { name: 'fenced JSON', prefix: '```json\n', suffix: '\n```' },
    { name: 'JSON in prose', prefix: 'Generated output: ', suffix: ' end.' },
  ])(
    'keeps support for successful $name responses',
    async ({ prefix, suffix }) => {
      testApp.repository.findAll.mockResolvedValue([testApp.word]);
      testApp.repository.findReviewCandidates.mockResolvedValue([testApp.word]);
      mockCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: `${prefix}${JSON.stringify({ questions: [validQuestion] })}${suffix}`,
            },
          },
        ],
      });
      const response = await request(testApp.server)
        .get(`${path}?limit=1`)
        .set('Authorization', testApp.authorization)
        .expect(200);
      expect(response.body).not.toHaveProperty('code');
      expect(response.body).toHaveProperty('questions.length', 1);
      expect(response.body).toHaveProperty(
        'questions.0.wordId',
        DICTIONARY_TEST_WORD_ID,
      );
      expect(response.body).toHaveProperty('questions.0.format', 'translation');
      expect(response.body).toHaveProperty('questions.0.options.length', 4);
      expect(response.body).toHaveProperty(
        'questions.0.options',
        expect.arrayContaining([
          {
            id: DICTIONARY_TEST_WORD_ID,
            text: 'Translation',
            translation: 'Translation',
          },
        ]),
      );
      expect(testApp.repository.findReviewCandidates).toHaveBeenCalledWith(
        DICTIONARY_TEST_USER_ID,
        1,
      );
    },
  );

  it('preserves translation, reverse-translation and cloze question formats', async () => {
    const reverseId = '33333333-3333-4333-8333-333333333333';
    const clozeId = '44444444-4444-4444-8444-444444444444';
    const words = [
      testApp.word,
      { ...testApp.word, id: reverseId, word: 'lesson' },
      { ...testApp.word, id: clozeId, word: 'practice' },
    ];
    testApp.repository.findAll.mockResolvedValue(words);
    testApp.repository.findReviewCandidates.mockResolvedValue(words);
    mockCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              questions: [
                validQuestion,
                {
                  wordId: reverseId,
                  format: 'reverse_translation',
                  distractors: ['alpha', 'beta', 'gamma'],
                },
                {
                  wordId: clozeId,
                  format: 'cloze',
                  clozePrompt: 'We ____ every day.',
                  distractors: ['read', 'write', 'listen'],
                },
              ],
            }),
          },
        },
      ],
    });
    const response = await request(testApp.server)
      .get(`${path}?limit=3`)
      .set('Authorization', testApp.authorization)
      .expect(200);
    expect(response.body).toHaveProperty('questions.length', 3);
    expect(response.body).toHaveProperty(
      'questions.1.format',
      'reverse_translation',
    );
    expect(response.body).toHaveProperty(
      'questions.1.options',
      expect.arrayContaining([
        { id: reverseId, text: 'lesson', translation: 'lesson' },
      ]),
    );
    expect(response.body).toHaveProperty('questions.2.format', 'cloze');
    expect(response.body).toHaveProperty(
      'questions.2.prompt',
      'We ____ every day.',
    );
    expect(response.body).toHaveProperty(
      'questions.2.options',
      expect.arrayContaining([
        { id: clozeId, text: 'practice', translation: 'practice' },
      ]),
    );
  });

  it('keeps repository failures separate from AI failures', async () => {
    testApp.repository.findAll.mockResolvedValue([testApp.word]);
    testApp.repository.findReviewCandidates.mockRejectedValue(
      new Error('secret database error'),
    );
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
    expect(mockCompletion).not.toHaveBeenCalled();
  });
});
