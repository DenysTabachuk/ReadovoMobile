import { getProgressLabel } from './index';

describe('getProgressLabel', () => {
  it.each([
    ['new', 'dictionary.progress.new'],
    ['in_progress', 'dictionary.progress.in_progress'],
    ['learned', 'dictionary.progress.learned'],
  ] as const)(
    'requests the translation key for %s and returns the translator result',
    (progress, expectedKey) => {
      const translate = jest.fn().mockReturnValue('translated-label');
      const t = translate as unknown as Parameters<typeof getProgressLabel>[1];

      expect(getProgressLabel(progress, t)).toBe('translated-label');
      expect(translate).toHaveBeenCalledTimes(1);
      expect(translate).toHaveBeenCalledWith(expectedKey);
    },
  );
});
