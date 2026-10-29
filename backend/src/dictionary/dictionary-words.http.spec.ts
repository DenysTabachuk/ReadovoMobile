import request from 'supertest';

import {
  createDictionaryHttpApp,
  DICTIONARY_TEST_USER_ID,
  DICTIONARY_TEST_WORD_ID,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

const path = '/api/dictionary/me/words';

describe('Dictionary words (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;

  beforeEach(async () => {
    testApp = await createDictionaryHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('rejects phrases longer than five words as a domain error', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({
        context: 'Context',
        translation: 'Translation',
        word: 'one two three four five six',
      })
      .expect(400, {
        statusCode: 400,
        code: 'DICTIONARY_WORD_TOO_LONG',
        message: 'Word or phrase must contain at most 5 words.',
      });
    expect(testApp.repository.create).not.toHaveBeenCalled();
  });

  it('keeps duplicate insert rejection at HTTP 400 with a stable code', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ context: 'Context', translation: 'Translation', word: 'example' })
      .expect(400, {
        statusCode: 400,
        code: 'DICTIONARY_WORD_ALREADY_EXISTS',
        message: 'Word or phrase already exists in dictionary.',
      });
    expect(testApp.repository.create).toHaveBeenCalledTimes(1);
  });

  it('creates a normalized word for the JWT owner without changing the success shape', async () => {
    testApp.repository.create.mockImplementation((word) =>
      Promise.resolve(word),
    );
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({
        context: ' Context ',
        translation: ' Translation ',
        word: ' example ',
      })
      .expect(201);
    expect(response.body).toMatchObject({
      context: 'Context',
      translation: 'Translation',
      word: 'example',
      userId: DICTIONARY_TEST_USER_ID,
      progress: 'new',
      correctAnswersCount: 0,
      requiredCorrectAnswers: 5,
    });
    expect(response.body).not.toHaveProperty('code');
  });

  it('rejects malformed creation data before the repository', async () => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ context: 'Context', translation: 'Translation', word: 42 })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['word'] }] },
    });
    expect(testApp.repository.create).not.toHaveBeenCalled();
  });

  it('keeps an empty dictionary successful', async () => {
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(200, []);
    expect(testApp.repository.findAll).toHaveBeenCalledWith(
      DICTIONARY_TEST_USER_ID,
    );
  });

  it('returns a domain 404 when deleting a missing word', async () => {
    await request(testApp.server)
      .delete(`${path}/${DICTIONARY_TEST_WORD_ID}`)
      .set('Authorization', testApp.authorization)
      .expect(404, {
        statusCode: 404,
        code: 'DICTIONARY_WORD_NOT_FOUND',
        message: 'Dictionary word was not found.',
      });
    expect(testApp.repository.deleteById).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
    );
  });

  it('keeps deleting an owned word successful', async () => {
    testApp.repository.deleteById.mockResolvedValue(testApp.word);
    await request(testApp.server)
      .delete(`${path}/${DICTIONARY_TEST_WORD_ID}`)
      .set('Authorization', testApp.authorization)
      .expect(200, testApp.word);
    expect(testApp.repository.deleteById).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
    );
  });

  it('rejects an invalid word ID before deletion', async () => {
    const response = await request(testApp.server)
      .delete(`${path}/invalid`)
      .set('Authorization', testApp.authorization)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['wordId'], rule: 'UUID_INVALID' }] },
    });
    expect(testApp.repository.deleteById).not.toHaveBeenCalled();
  });

  it('hides unexpected repository failures instead of treating them as duplicates', async () => {
    testApp.repository.create.mockRejectedValue(
      new Error('secret database credentials'),
    );
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ context: 'Context', translation: 'Translation', word: 'example' })
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });
});
