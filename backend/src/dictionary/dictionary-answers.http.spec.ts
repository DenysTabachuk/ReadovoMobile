import request from 'supertest';

import {
  createDictionaryHttpApp,
  DICTIONARY_TEST_USER_ID,
  DICTIONARY_TEST_WORD_ID,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

const path = '/api/dictionary/me/test/answer';

describe('Dictionary answer submission (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;

  beforeEach(async () => {
    testApp = await createDictionaryHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('returns a domain 404 for a missing word', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({
        wordId: DICTIONARY_TEST_WORD_ID,
        selectedOptionId: DICTIONARY_TEST_WORD_ID,
      })
      .expect(404, {
        statusCode: 404,
        code: 'DICTIONARY_WORD_NOT_FOUND',
        message: 'Dictionary word was not found.',
      });
    expect(testApp.repository.findById).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
    );
    expect(testApp.repository.updateReviewResult).not.toHaveBeenCalled();
  });

  it('returns the same domain 404 if the word disappears during review', async () => {
    testApp.repository.findById.mockResolvedValue(testApp.word);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({
        wordId: DICTIONARY_TEST_WORD_ID,
        selectedOptionId: DICTIONARY_TEST_WORD_ID,
      })
      .expect(404, {
        statusCode: 404,
        code: 'DICTIONARY_WORD_NOT_FOUND',
        message: 'Dictionary word was not found.',
      });
    expect(testApp.repository.updateReviewResult).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
      'in_progress',
      1,
      expect.any(String),
    );
  });

  it.each([
    {
      name: 'correct',
      selectedOptionId: DICTIONARY_TEST_WORD_ID,
      isCorrect: true,
      correctAnswersCount: 1,
    },
    {
      name: 'incorrect',
      selectedOptionId: `${DICTIONARY_TEST_WORD_ID}:distractor:1`,
      isCorrect: false,
      correctAnswersCount: 0,
    },
  ])(
    'keeps a $name answer as an HTTP success',
    async ({ selectedOptionId, isCorrect, correctAnswersCount }) => {
      testApp.repository.findById.mockResolvedValue(testApp.word);
      const reviewed = {
        ...testApp.word,
        progress: 'in_progress',
        correctAnswersCount,
      } as const;
      testApp.repository.updateReviewResult.mockResolvedValue(reviewed);
      await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send({ wordId: DICTIONARY_TEST_WORD_ID, selectedOptionId })
        .expect(201, {
          correctOptionId: DICTIONARY_TEST_WORD_ID,
          correctTranslation: 'Translation',
          isCorrect,
          word: reviewed,
        });
      expect(testApp.repository.updateReviewResult).toHaveBeenCalledWith(
        DICTIONARY_TEST_WORD_ID,
        DICTIONARY_TEST_USER_ID,
        'in_progress',
        correctAnswersCount,
        expect.any(String),
      );
    },
  );

  it('rejects malformed answer input in the DTO', async () => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ wordId: DICTIONARY_TEST_WORD_ID, selectedOptionId: '' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['selectedOptionId'] }] },
    });
    expect(testApp.repository.findById).not.toHaveBeenCalled();
  });
});
