import { createHttpResponse } from '.';

it('builds isolated fixtures and preserves JSON, text and explicit status', () => {
  expect(createHttpResponse('{"id":1}', { status: 201 })).toMatchObject({
    data: { id: 1 },
    status: 201,
  });
  expect(createHttpResponse('text').data).toBe('text');
  expect(createHttpResponse(null).data).toBeNull();
  const first = createHttpResponse();
  const second = createHttpResponse();
  expect(first.headers).not.toBe(second.headers);
  expect(first.config).not.toBe(second.config);
});
