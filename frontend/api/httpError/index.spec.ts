import { HttpError } from '.';

it('retains status and domain data without exposing request config or serializing the payload', () => {
  const error = new HttpError({
    status: 409,
    data: { message: 'duplicate', private: 'secret' },
  });
  expect(error.status).toBe(409);
  expect(error.response.data).toEqual({
    message: 'duplicate',
    private: 'secret',
  });
  expect(error).not.toHaveProperty('config');
  expect(JSON.stringify(error)).not.toContain('secret');
});

it.each(['MASCOT_NOT_ENOUGH_COINS', 'FUTURE_ERROR_CODE'])(
  'exposes the string code %s without interpreting it',
  (code) => {
    const data = Object.freeze({
      code,
      message: 'Private backend diagnostic.',
    });
    const response = Object.freeze({ status: 400, data });
    const error = new HttpError(response);

    expect(error.code).toBe(code);
    expect(error.status).toBe(400);
    expect(error.message).toBe('HTTP request failed.');
    expect(error.response.data).toBe(data);
    expect(JSON.stringify(error)).not.toContain('Private backend diagnostic.');
  },
);

it.each([
  null,
  '<html>Proxy error</html>',
  [],
  {},
  { code: null },
  { code: 42 },
])('leaves code undefined for response body %#', (data) => {
  const error = new HttpError({ status: 502, data });
  expect(error.code).toBeUndefined();
  expect(error.status).toBe(502);
});
