import Ajv from 'ajv';

import { createTranslationPairSchemas } from '.';

const pairs = [
  { sourceLanguage: 'en', targetLanguage: 'uk' },
  { sourceLanguage: 'de', targetLanguage: 'en' },
];
const defaultPair = { sourceLanguage: 'en', targetLanguage: 'uk' };

describe('createTranslationPairSchemas', () => {
  describe('request fields with server defaults', () => {
    const validate = new Ajv().compile({
      type: 'object',
      oneOf: createTranslationPairSchemas(pairs, defaultPair),
    });

    it.each([
      [{}, true],
      [{ sourceLanguage: 'en' }, true],
      [{ targetLanguage: 'uk' }, true],
      [{ sourceLanguage: 'en', targetLanguage: 'uk' }, true],
      [{ sourceLanguage: 'de', targetLanguage: 'en' }, true],
      [{ sourceLanguage: 'en', targetLanguage: 'en' }, false],
      [{ sourceLanguage: 'de', targetLanguage: 'uk' }, false],
      [{ sourceLanguage: 'de' }, false],
      [{ targetLanguage: 'en' }, false],
      [{ sourceLanguage: null }, false],
    ])('matches effective pair for %j as %s', (body, allowed) => {
      expect(validate(body)).toBe(allowed);
    });
  });

  it('requires both response languages and does not modify the policy', () => {
    const original = JSON.stringify(pairs);
    const validate = new Ajv().compile({
      type: 'object',
      oneOf: createTranslationPairSchemas(pairs),
    });
    expect(validate({ sourceLanguage: 'en', targetLanguage: 'uk' })).toBe(true);
    expect(validate({ sourceLanguage: 'de', targetLanguage: 'en' })).toBe(true);
    expect(validate({})).toBe(false);
    expect(validate({ sourceLanguage: 'en' })).toBe(false);
    expect(validate({ sourceLanguage: 'de', targetLanguage: 'uk' })).toBe(
      false,
    );
    expect(JSON.stringify(pairs)).toBe(original);
  });
});
