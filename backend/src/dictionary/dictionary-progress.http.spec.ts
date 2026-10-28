import request from 'supertest';

import {
  createDictionaryHttpApp,
  DICTIONARY_TEST_USER_ID,
  DICTIONARY_TEST_WORD_ID,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

const path = `/api/dictionary/me/words/${DICTIONARY_TEST_WORD_ID}/progress`;

describe('Dictionary manual progress (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;

  beforeEach(async () => {
    testApp = await createDictionaryHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('rejects unsupported progress in the DTO before persistence', async () => {
    const response = await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send({ progress: 'learned' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['progress'], rule: 'VALUE_NOT_ALLOWED' }] },
    });
    expect(testApp.repository.findById).not.toHaveBeenCalled();
    expect(testApp.repository.updateProgress).not.toHaveBeenCalled();
  });

  it('returns a domain 404 for a missing word', async () => {
    await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send({ progress: 'in_progress' })
      .expect(404, {
        statusCode: 404,
        code: 'DICTIONARY_WORD_NOT_FOUND',
        message: 'Dictionary word was not found.',
      });
    expect(testApp.repository.findById).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
    );
    expect(testApp.repository.updateProgress).not.toHaveBeenCalled();
  });

  it('returns the same domain 404 if the word disappears during the update', async () => {
    testApp.repository.findById.mockResolvedValue(testApp.word);
    await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send({ progress: 'in_progress' })
      .expect(404, {
        statusCode: 404,
        code: 'DICTIONARY_WORD_NOT_FOUND',
        message: 'Dictionary word was not found.',
      });
    expect(testApp.repository.updateProgress).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
      'in_progress',
      0,
    );
  });

  it('preserves the learned-word reset rule and success shape', async () => {
    testApp.repository.findById.mockResolvedValue({
      ...testApp.word,
      progress: 'learned',
      correctAnswersCount: 5,
    });
    const updated = {
      ...testApp.word,
      progress: 'in_progress',
      correctAnswersCount: 4,
    } as const;
    testApp.repository.updateProgress.mockResolvedValue(updated);
    await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send({ progress: 'in_progress' })
      .expect(200, updated);
    expect(testApp.repository.updateProgress).toHaveBeenCalledWith(
      DICTIONARY_TEST_WORD_ID,
      DICTIONARY_TEST_USER_ID,
      'in_progress',
      4,
    );
  });
});
