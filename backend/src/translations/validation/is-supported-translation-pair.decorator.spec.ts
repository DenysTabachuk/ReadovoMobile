import { validate } from 'class-validator';

import { IsSupportedTranslationPair } from './is-supported-translation-pair.decorator';

// Both directions are independently present; their cross-product is not allowed.
const pairs = [
  { sourceLanguage: 'en', targetLanguage: 'uk' },
  { sourceLanguage: 'uk', targetLanguage: 'en' },
];

class PairDto {
  declare sourceLanguage: unknown;

  @IsSupportedTranslationPair(pairs)
  declare targetLanguage: unknown;
}

describe('IsSupportedTranslationPair', () => {
  it.each([
    ['en', 'uk', true],
    ['uk', 'en', true],
    ['en', 'en', false],
    ['uk', 'uk', false],
    ['de', 'uk', false],
    ['en', 'qqqq', false],
    [undefined, 'uk', false],
    ['en', null, false],
    [42, 'uk', false],
  ])(
    'validates %s -> %s as allowed=%s',
    async (sourceLanguage, targetLanguage, allowed) => {
      const dto = Object.assign(new PairDto(), {
        sourceLanguage,
        targetLanguage,
      });
      const errors = await validate(dto);
      expect(errors.length === 0).toBe(allowed);
    },
  );
});
