import { resolveMascotErrorMessage } from './index';

describe('resolveMascotErrorMessage', () => {
  it.each([
    ['Not enough coins.', 'mascot.errors.notEnoughCoins'],
    ['Mascot item is not owned.', 'mascot.errors.itemNotOwned'],
  ])('maps %s', async (message, expected) => {
    const response = Response.json({ message });
    await expect(resolveMascotErrorMessage(response, 'fallback')).resolves.toBe(
      expected,
    );
    expect(response.bodyUsed).toBe(true);
  });
  it('uses only the first error in a message array', async () => {
    await expect(
      resolveMascotErrorMessage(
        Response.json({ message: ['Not enough coins.', 'Other'] }),
        'fallback',
      ),
    ).resolves.toBe('mascot.errors.notEnoughCoins');
    await expect(
      resolveMascotErrorMessage(
        Response.json({ message: ['Other', 'Not enough coins.'] }),
        'fallback',
      ),
    ).resolves.toBe('fallback');
  });
  it('falls back for missing/unknown messages, malformed JSON, or an already-consumed response', async () => {
    for (const payload of [{}, { message: [] }, { message: 'Unknown' }, null]) {
      await expect(
        resolveMascotErrorMessage(Response.json(payload), 'fallback'),
      ).resolves.toBe('fallback');
    }
    await expect(
      resolveMascotErrorMessage(new Response('invalid'), 'fallback'),
    ).resolves.toBe('fallback');
    const consumed = Response.json({ message: 'Not enough coins.' });
    await consumed.json();
    await expect(resolveMascotErrorMessage(consumed, 'fallback')).resolves.toBe(
      'fallback',
    );
  });
});
