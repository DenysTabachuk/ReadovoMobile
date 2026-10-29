import { AxiosError } from 'axios';
import request from 'supertest';

import {
  createWikipediaHttpApp,
  WIKIPEDIA_TEST_RESPONSE,
  type WikipediaHttpTestApp,
} from '../testing/create-wikipedia-http-app';

describe('Wikipedia provider errors (HTTP)', () => {
  let testApp: WikipediaHttpTestApp;
  beforeEach(async () => {
    testApp = await createWikipediaHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each(['/articles?recommended=false', '/articles/random', '/articles/42'])(
    'maps JSON HTTP failures on %s without exposing provider details',
    async (path) => {
      testApp.provider.mockImplementationOnce((config) =>
        Promise.reject(
          new AxiosError(
            'private provider message',
            'ERR_BAD_RESPONSE',
            config,
            undefined,
            {
              config,
              data: { error: 'private provider body' },
              headers: {},
              status: 403,
              statusText: 'Forbidden',
            },
          ),
        ),
      );
      await request(testApp.server).get(path).expect(502, {
        statusCode: 502,
        code: 'ARTICLES_WIKIPEDIA_REQUEST_FAILED',
        message: 'Failed to fetch Wikipedia content.',
      });
    },
  );

  it('distinguishes HTML HTTP failures from JSON failures', async () => {
    testApp.provider
      .mockResolvedValueOnce(WIKIPEDIA_TEST_RESPONSE)
      .mockImplementationOnce((config) =>
        Promise.reject(
          new AxiosError(
            'private HTML error',
            'ERR_BAD_RESPONSE',
            config,
            undefined,
            {
              config,
              data: '<html>private error</html>',
              headers: {},
              status: 404,
              statusText: 'Not Found',
            },
          ),
        ),
      );
    await request(testApp.server).get('/articles/42').expect(502, {
      statusCode: 502,
      code: 'ARTICLES_WIKIPEDIA_HTML_REQUEST_FAILED',
      message: 'Failed to fetch Wikipedia article HTML.',
    });
  });

  it.each(['/articles', '/articles?search=space&category=science'])(
    'propagates a fallback request failure on %s',
    async (path) => {
      testApp.provider
        .mockResolvedValueOnce({ query: { pages: {} } })
        .mockImplementationOnce((config) =>
          Promise.reject(
            new AxiosError(
              'private fallback error',
              'ERR_BAD_RESPONSE',
              config,
              undefined,
              {
                config,
                data: {},
                headers: {},
                status: 503,
                statusText: 'Unavailable',
              },
            ),
          ),
        );
      await request(testApp.server).get(path).expect(502, {
        statusCode: 502,
        code: 'ARTICLES_WIKIPEDIA_REQUEST_FAILED',
        message: 'Failed to fetch Wikipedia content.',
      });
    },
  );

  it.each([
    {},
    { query: { pages: {} } },
    { query: { pages: { '42': { pageid: 42, title: 'Space' } } } },
  ])(
    'maps absent article metadata %# to the existing 502 status',
    async (data) => {
      testApp.provider.mockResolvedValueOnce(data);
      await request(testApp.server).get('/articles/42').expect(502, {
        statusCode: 502,
        code: 'ARTICLES_WIKIPEDIA_ARTICLE_UNAVAILABLE',
        message: 'Wikipedia article is unavailable.',
      });
      expect(testApp.provider).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    null,
    [],
    { query: { pages: [] } },
    { query: { pages: { '42': { pageid: '42', title: 'Space' } } } },
  ])(
    'rejects malformed decoded JSON %# with a stable provider code',
    async (data) => {
      testApp.provider.mockResolvedValueOnce(data);
      await request(testApp.server)
        .get('/articles?recommended=false')
        .expect(502, {
          statusCode: 502,
          code: 'ARTICLES_WIKIPEDIA_INVALID_RESPONSE',
          message: 'Wikipedia response is invalid.',
        });
    },
  );

  it.each(['', '<html><body></body></html>', null, { unexpected: 'HTML' }])(
    'maps unusable HTML %# to content unavailable',
    async (html) => {
      testApp.provider
        .mockResolvedValueOnce(WIKIPEDIA_TEST_RESPONSE)
        .mockResolvedValueOnce(html);
      await request(testApp.server).get('/articles/42').expect(502, {
        statusCode: 502,
        code: 'ARTICLES_WIKIPEDIA_CONTENT_UNAVAILABLE',
        message: 'Wikipedia article content is unavailable.',
      });
    },
  );

  it('preserves generic 500 for transport failures without an HTTP response', async () => {
    testApp.provider.mockRejectedValueOnce(
      new AxiosError('private timeout', 'ETIMEDOUT'),
    );
    await request(testApp.server).get('/articles/random').expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });

  it('preserves generic 500 for provider JSON rejected by the transport parser', async () => {
    testApp.provider.mockResolvedValueOnce('<html>private error page</html>');
    await request(testApp.server).get('/articles/random').expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });
});
