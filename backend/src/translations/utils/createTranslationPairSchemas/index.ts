import { type SchemaObject } from '@nestjs/swagger';

import { type TranslationLanguagePair } from '../../types';

/**
 * Describes allowed language pairs as OpenAPI oneOf branches.
 * @param pairs - Explicit allowed directions; input order is preserved.
 * @param defaultPair - Effective values of omitted request fields. Without this,
 * both language fields are required, as in a serialized successful response.
 * @returns Schemas matching the same pair policy as DTO validation. Non-default
 * fields are required so omitted inputs cannot match several branches. No inputs
 * are mutated. Trimming/lowercasing remains the request transform's responsibility.
 * @example
 * createTranslationPairSchemas([{ sourceLanguage: 'en', targetLanguage: 'uk' }]);
 * // => [{ type: 'object', properties: { sourceLanguage: { type: 'string',
 * //      enum: ['en'] }, targetLanguage: { type: 'string', enum: ['uk'] } },
 * //      required: ['sourceLanguage', 'targetLanguage'] }]
 */
export function createTranslationPairSchemas(
  pairs: readonly TranslationLanguagePair[],
  defaultPair?: TranslationLanguagePair,
): SchemaObject[] {
  return pairs.map((pair) => {
    const required: string[] = [];
    if (pair.sourceLanguage !== defaultPair?.sourceLanguage)
      required.push('sourceLanguage');
    if (pair.targetLanguage !== defaultPair?.targetLanguage)
      required.push('targetLanguage');
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        sourceLanguage: { type: 'string', enum: [pair.sourceLanguage] },
        targetLanguage: { type: 'string', enum: [pair.targetLanguage] },
      },
    };
    if (required.length > 0) schema.required = required;
    return schema;
  });
}
