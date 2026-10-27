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
