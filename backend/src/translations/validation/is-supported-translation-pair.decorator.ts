import { registerDecorator, type ValidationArguments } from 'class-validator';

import { type TranslationLanguagePair } from '../types';

/**
 * Validates a target language together with the DTO's normalized sourceLanguage.
 * @param pairs - Explicitly allowed directions; reversed and identical languages
 * are accepted only if their exact pair is listed. The list is not mutated.
 * @returns A class-validator property decorator. Invalid or missing language
 * values fail; shared error serialization uses the safe VALUE_INVALID rule.
 * @example
 * @IsSupportedTranslationPair([{ sourceLanguage: 'en', targetLanguage: 'uk' }])
 * // targetLanguage='uk' passes with sourceLanguage='en'; 'en'/'en' fails.
 */
export function IsSupportedTranslationPair(
  pairs: readonly TranslationLanguagePair[],
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isSupportedTranslationPair',
      target: target.constructor,
      propertyName: propertyName.toString(),
      validator: {
        validate(value: unknown, arguments_?: ValidationArguments): boolean {
          if (!arguments_ || !('sourceLanguage' in arguments_.object))
            return false;
          const { sourceLanguage } = arguments_.object;
          return pairs.some(
            (pair) =>
              pair.sourceLanguage === sourceLanguage &&
              pair.targetLanguage === value,
          );
        },
      },
    });
  };
}
