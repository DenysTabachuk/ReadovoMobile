import { HttpError } from '../../httpError';
import { mapHttpError } from '.';

it('maps HTTP errors to fallback and business status keys', async () => {
  await expect(
    mapHttpError('translation.error')(new HttpError({ status: 500, data: '' })),
  ).rejects.toThrow('translation.error');
  await expect(
    mapHttpError('fallback', { statuses: { 409: 'duplicate' } })(
      new HttpError({ status: 409, data: '' }),
    ),
  ).rejects.toThrow('duplicate');
});
it('supports domain response mappings', async () => {
  const resolveMessage = jest
    .fn()
    .mockResolvedValue('streak.errors.notEnoughCoins');
  await expect(
    mapHttpError('fallback', { resolveMessage })(
      new HttpError({ status: 400, data: { message: 'Not enough coins.' } }),
    ),
  ).rejects.toThrow('streak.errors.notEnoughCoins');
  expect(resolveMessage).toHaveBeenCalledWith({
    status: 400,
    data: { message: 'Not enough coins.' },
  });
});
it.each(['AbortError', 'NetworkError', 'TimeoutError', 'SyntaxError'])(
  'preserves %s identity without converting it to a business failure',
  async (name) => {
    const error = Object.assign(new Error('original'), { name });
    await expect(mapHttpError('fallback')(error)).rejects.toBe(error);
  },
);
