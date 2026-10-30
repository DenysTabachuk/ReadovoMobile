import request from 'supertest';
import {
  createDictionaryHttpApp,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

describe('Retired unbound dictionary answers (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;
  beforeEach(async () => {
    testApp = await createDictionaryHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('does not accept a word ID as evidence of a quiz attempt', async () => {
    await request(testApp.server)
      .post('/api/dictionary/me/test/answer')
      .set('Authorization', testApp.authorization)
      .send({ wordId: testApp.word.id, selectedOptionId: testApp.word.id })
      .expect(404, {
        statusCode: 404,
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found.',
      });
    expect(testApp.repository.findById).not.toHaveBeenCalled();
    expect(testApp.repository.updateProgress).not.toHaveBeenCalled();
  });
});
