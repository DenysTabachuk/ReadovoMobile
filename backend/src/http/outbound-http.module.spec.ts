import { HttpService } from '@nestjs/axios';
import { Test, type TestingModule } from '@nestjs/testing';
import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';

import { OutboundHttpModule } from './outbound-http.module';

describe('injected outbound Axios transport', () => {
  let server: Server;
  let module: TestingModule;
  let http: HttpService;
  let baseURL: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      if (request.url === '/redirect') {
        response.writeHead(302, { Location: '/json' }).end();
      } else if (request.url === '/gzip') {
        response.writeHead(200, {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/json',
        });
        response.end(gzipSync('{"compressed":true}'));
      } else if (request.url === '/text') {
        response.end('<html>Article</html>');
      } else if (request.url === '/invalid') {
        response.end('<html>Invalid JSON</html>');
      } else if (request.url === '/denied') {
        response.writeHead(401).end('<html>Denied</html>');
      } else if (request.url === '/empty') {
        response.writeHead(204).end();
      } else {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', (chunk: string) => {
          body += chunk;
        });
        request.on('end', () =>
          response.end(
            JSON.stringify({
              method: request.method,
              url: request.url,
              body,
              contentType: request.headers['content-type'],
              authorization: request.headers.authorization,
            }),
          ),
        );
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    module = await Test.createTestingModule({
      imports: [OutboundHttpModule],
    }).compile();
    http = module.get(HttpService);
  });
  afterAll(async () => {
    await module?.close();
    server?.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  it('preserves encoded URLs, JSON bodies and methods without adding credentials', async () => {
    const response = await http.axiosRef.post(`${baseURL}/echo?q=a%2Bb%26c`, {
      word: 'sun',
    });
    expect(response.data).toEqual({
      method: 'POST',
      url: '/echo?q=a%2Bb%26c',
      body: '{"word":"sun"}',
      contentType: 'application/json',
    });
  });
  it('follows redirects and decompresses provider JSON', async () => {
    expect((await http.axiosRef.get(`${baseURL}/redirect`)).data).toMatchObject(
      { url: '/json' },
    );
    expect((await http.axiosRef.get(`${baseURL}/gzip`)).data).toEqual({
      compressed: true,
    });
  });
  it('keeps text, HTTP error and empty response contracts', async () => {
    expect(
      (await http.axiosRef.get(`${baseURL}/text`, { responseType: 'text' }))
        .data,
    ).toBe('<html>Article</html>');
    await expect(http.axiosRef.get(`${baseURL}/denied`)).rejects.toMatchObject({
      status: 401,
    });
    expect(await http.axiosRef.get(`${baseURL}/empty`)).toMatchObject({
      status: 204,
      data: '',
    });
    await expect(
      http.axiosRef.get(`${baseURL}/invalid`),
    ).rejects.toBeInstanceOf(SyntaxError);
  });
  it('does not expose sensitive Axios configuration on transport failure', async () => {
    const controller = new AbortController();
    controller.abort();
    const error: unknown = await http.axiosRef
      .get(`${baseURL}/?key=secret`, { signal: controller.signal })
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toHaveProperty('config');
    expect(String(error)).not.toContain('secret');
  });
});
