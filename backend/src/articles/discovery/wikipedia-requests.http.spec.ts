import request from 'supertest';

import {
  createWikipediaHttpApp,
  type WikipediaHttpTestApp,
} from '../testing/create-wikipedia-http-app';

describe('Wikipedia request and success contracts (HTTP)', () => {
  let testApp: WikipediaHttpTestApp;
  beforeEach(async () => {
    testApp = await createWikipediaHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each(['/articles?recommended=false', '/articles/random'])(
    'keeps public previews on %s',
    async (path) => {
      await request(testApp.server)
        .get(path)
        .expect(200, [
          {
            extract: 'Space is vast.',
            id: 42,
            pageLength: 1000,
            title: 'Space',
            url: 'https://en.wikipedia.org/wiki/Space',
          },
        ]);
    },
  );

  it('keeps HTML detail parsing and its public payload', async () => {
    const response = await request(testApp.server)
      .get('/articles/42')
      .expect(200);
    expect(response.body).toMatchObject({
      id: 42,
      title: 'Space',
      url: 'https://en.wikipedia.org/wiki/Space',
      content: 'Space is vast.',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'word', text: 'Space' },
            { type: 'text', text: ' ' },
            { type: 'word', text: 'is' },
            { type: 'text', text: ' ' },
            { type: 'word', text: 'vast' },
            { type: 'text', text: '.' },
          ],
        },
      ],
    });
    expect(response.body).not.toHaveProperty('code');
    expect(testApp.provider).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        responseType: 'text',
        url: 'https://en.wikipedia.org/w/rest.php/v1/page/Space/html',
      }),
    );
  });

  it.each([
    {},
    { query: null },
    { query: { pages: null } },
    { query: { pages: {} } },
  ])('keeps empty discovery response %# successful', async (data) => {
    testApp.provider.mockResolvedValueOnce(data);
    await request(testApp.server)
      .get('/articles?recommended=false')
      .expect(200, []);
  });

  it.each([
    '/articles?limit=0',
    '/articles/random?limit=51',
    '/articles?category=invalid',
    '/articles/invalid',
    '/articles/42?languageCode=uk',
  ])('validates %s before provider access', async (path) => {
    const response = await request(testApp.server).get(path).expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.provider).not.toHaveBeenCalled();
  });

  it('hides persistence failures while attaching available adaptations', async () => {
    testApp.prisma.articleSimplification.findMany.mockRejectedValueOnce(
      new Error('private database error'),
    );
    await request(testApp.server).get('/articles/random').expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });
});
