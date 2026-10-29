import { AxiosError } from 'axios';

import { createHttpClient } from '.';
import { HttpError } from '../../httpError';
import { createHttpResponse, mockHttpAdapter } from '../../testing/http';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'https://api.example.test' }));

it('installs feature interceptors once, before safe error normalization', async () => {
  const rejected = jest.fn((error: unknown): never => {
    throw error;
  });
  const configure = jest.fn((client: ReturnType<typeof createHttpClient>) => {
    client.interceptors.response.use(undefined, rejected);
  });
  const client = createHttpClient(configure);
  const adapter = mockHttpAdapter(client).mockResolvedValue(
    createHttpResponse('', { status: 401 }),
  );
  await expect(client.get('/test')).rejects.toBeInstanceOf(HttpError);
  await expect(client.get('/test')).rejects.toBeInstanceOf(HttpError);
  expect(rejected.mock.calls[0][0]).toBeInstanceOf(AxiosError);
  expect(configure).toHaveBeenCalledTimes(1);
  expect(adapter).toHaveBeenCalledTimes(2);
});

describe('development request diagnostics', () => {
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, '__DEV__');

  beforeEach(() => {
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: true,
    });
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalDev) {
      Object.defineProperty(globalThis, '__DEV__', originalDev);
    } else {
      Reflect.deleteProperty(globalThis, '__DEV__');
    }
  });

  it('logs the request and response without URL credentials, query, headers or payload', async () => {
    const client = createHttpClient();
    mockHttpAdapter(client).mockResolvedValue(createHttpResponse({ ok: true }));

    await client.post(
      'https://username:private-password@api.example.test/auth/login?token=private-query',
      { password: 'private-body' },
      { headers: { Authorization: 'Bearer private-header' } },
    );

    expect(console.info).toHaveBeenNthCalledWith(
      1,
      '[API] request POST https://api.example.test/auth/login',
    );
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      '[API] response 200 POST https://api.example.test/auth/login',
    );
    expect(console.info).toHaveBeenCalledTimes(2);
  });

  it.each([401, undefined])(
    'distinguishes an HTTP %s failure from an unreachable server',
    async (status) => {
      const client = createHttpClient();
      const adapter = mockHttpAdapter(client);
      if (status) {
        adapter.mockResolvedValue(createHttpResponse({}, { status }));
      } else {
        adapter.mockImplementation(async (config) => {
          throw new AxiosError('private-error', 'ERR_NETWORK', config);
        });
      }

      await expect(client.post('/auth/login')).rejects.toBeInstanceOf(Error);

      expect(console.info).toHaveBeenLastCalledWith(
        `[API] failed ${status ?? 'no response'} POST https://api.example.test/auth/login`,
      );
    },
  );

  it('does not log requests outside development', async () => {
    Object.defineProperty(globalThis, '__DEV__', { value: false });
    const client = createHttpClient();
    mockHttpAdapter(client).mockResolvedValue(createHttpResponse({ ok: true }));

    await client.get('/test');

    expect(console.info).not.toHaveBeenCalled();
  });
});
