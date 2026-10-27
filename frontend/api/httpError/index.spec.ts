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
