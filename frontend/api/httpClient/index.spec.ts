import { createHttpClient } from '../utils/createHttpClient';
import { AxiosError, CanceledError } from 'axios';

import { createHttpResponse, mockHttpAdapter } from '../testing/http';
import { httpClient } from '.';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'https://api.example.test' }));

const sessionHttpClient = createHttpClient();

it('allows an empty 200 body for endpoints that explicitly do not consume JSON', async () => {
  mockHttpAdapter(sessionHttpClient).mockResolvedValue(createHttpResponse(''));
  await expect(
    sessionHttpClient.post(
      '/notifications/push-token/me',
      {},
      { responseType: 'text' },
    ),
  ).resolves.toMatchObject({ status: 200, data: '' });
});

it('uses separate instances and never adds a session token to public calls', async () => {
  const adapter = mockHttpAdapter(sessionHttpClient).mockResolvedValue(
    createHttpResponse({ ok: true }),
  );
  expect(sessionHttpClient).not.toBe(httpClient);
  await httpClient.post('/auth/login', { password: 'secret' });
  const config = adapter.mock.calls[0][0];
  expect(config.headers.has('Authorization')).toBe(false);
  expect(config.data).toBe('{"password":"secret"}');
});
it.each([400, 401, 409, 429, 500, 503])(
  'rejects HTTP %s for endpoint error mapping',
  async (status) => {
    mockHttpAdapter(sessionHttpClient).mockResolvedValue(
      createHttpResponse('<html>Error</html>', { status }),
    );
    await expect(httpClient.get('/test')).rejects.toMatchObject({
      status,
      response: { data: '<html>Error</html>' },
    });
  },
);
it('parses JSON through the real response transform and rejects malformed successes', async () => {
  const adapter = mockHttpAdapter(sessionHttpClient).mockResolvedValue({
    ...createHttpResponse(),
    data: '{"id":7}',
  });
  await expect(httpClient.get('/test')).resolves.toMatchObject({
    data: { id: 7 },
  });
  adapter.mockResolvedValue({
    ...createHttpResponse(),
    data: '<html>invalid</html>',
  });
  await expect(httpClient.get('/test')).rejects.toBeInstanceOf(SyntaxError);
});
it('maps Axios cancellation and already cancelled signals to AbortError without retry', async () => {
  const adapter = mockHttpAdapter(sessionHttpClient).mockRejectedValue(
    new CanceledError(),
  );
  await expect(httpClient.get('/test')).rejects.toMatchObject({
    name: 'AbortError',
  });
  const controller = new AbortController();
  controller.abort();
  await expect(
    httpClient.get('/test', { signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(adapter).toHaveBeenCalledTimes(1);
});
it.each([
  ['ERR_NETWORK', 'NetworkError'],
  ['ECONNABORTED', 'TimeoutError'],
])('sanitizes %s without exposing Axios config', async (code, name) => {
  const failure = new AxiosError('Contains private payload', code, {
    headers: { Authorization: 'secret' },
  } as never);
  mockHttpAdapter(sessionHttpClient).mockRejectedValue(failure);
  const error: unknown = await httpClient
    .get('/test')
    .catch((reason: unknown) => reason);
  expect(error).toMatchObject({ name });
  expect(error).not.toHaveProperty('config');
  expect(String(error)).not.toContain('private');
});
