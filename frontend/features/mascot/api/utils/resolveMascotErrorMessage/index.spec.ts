import { createHttpResponse } from '@/api/testing/http';
import { resolveMascotErrorMessage } from './index';

describe('resolveMascotErrorMessage', () => {
  it.each([
    ['Not enough coins.', 'mascot.errors.notEnoughCoins'],
    ['Mascot item is not owned.', 'mascot.errors.itemNotOwned'],
  ])('maps %s', async (message, expected) => {
    const response = createHttpResponse({ message });
    await expect(resolveMascotErrorMessage(response, 'fallback')).resolves.toBe(
      expected,
    );
  });
  it('uses only the first error in a message array', async () => {
    await expect(
      resolveMascotErrorMessage(
        createHttpResponse({ message: ['Not enough coins.', 'Other'] }),
        'fallback',
      ),
    ).resolves.toBe('mascot.errors.notEnoughCoins');
    await expect(
      resolveMascotErrorMessage(
        createHttpResponse({ message: ['Other', 'Not enough coins.'] }),
        'fallback',
      ),
    ).resolves.toBe('fallback');
  });
  it('falls back for missing/unknown messages, malformed JSON, or non-object data', async () => {
    for (const payload of [{}, { message: [] }, { message: 'Unknown' }, null]) {
      await expect(
        resolveMascotErrorMessage(createHttpResponse(payload), 'fallback'),
      ).resolves.toBe('fallback');
    }
    await expect(
      resolveMascotErrorMessage(createHttpResponse('invalid'), 'fallback'),
    ).resolves.toBe('fallback');
  });
});
