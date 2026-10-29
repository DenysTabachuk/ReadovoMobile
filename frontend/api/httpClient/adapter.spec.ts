import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';

import { HttpError } from '../httpError';
import { httpClient } from '.';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'https://api.example.test' }));

describe('real Axios adapter status rejection', () => {
  let server: Server;
  let baseURL: string;
  beforeAll(async () => {
    server = createServer((request, response) => {
      response.writeHead(Number(request.url?.slice(1)), {
        'Content-Type': 'application/json',
      });
      response.end('{"message":"server response"}');
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  it('resolves a successful response', async () => {
    await expect(
      httpClient.get(`${baseURL}/200`, { adapter: 'http', proxy: false }),
    ).resolves.toMatchObject({ data: { message: 'server response' } });
  });
  it.each([401, 409, 500])(
    'rejects HTTP %s without feature status checks',
    async (status) => {
      const request = httpClient.get(`${baseURL}/${status}`, {
        adapter: 'http',
        proxy: false,
      });
      await expect(request).rejects.toBeInstanceOf(HttpError);
      await expect(request).rejects.toMatchObject({
        status,
        response: { data: { message: 'server response' } },
      });
    },
  );
});
