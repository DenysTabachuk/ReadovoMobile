import { CanceledError } from 'axios';

import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';

import { translateWord } from '.';

it('returns translation data and lets Axios serialize the request', async () => {
  const result = { translation: 'сонце' };
  const adapter = mockHttpAdapter().mockResolvedValue(
    createHttpResponse(result),
  );
  await expect(translateWord({ word: 'sun' })).resolves.toEqual(result);
  expect(adapter.mock.calls[0][0]).toMatchObject({
    method: 'post',
    data: '{"word":"sun"}',
  });
});
it('preserves a rejected HTTP response for presentation', async () => {
  mockHttpAdapter().mockResolvedValue(
    createHttpResponse('Unavailable', { status: 503 }),
  );
  await expect(translateWord({ word: 'sun' })).rejects.toMatchObject({
    status: 503,
  });
});
it('keeps cancellation distinguishable from a translation failure', async () => {
  mockHttpAdapter().mockRejectedValue(new CanceledError());
  await expect(translateWord({ word: 'sun' })).rejects.toMatchObject({
    name: 'AbortError',
  });
});
