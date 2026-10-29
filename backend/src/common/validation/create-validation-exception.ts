import { type ValidationError } from 'class-validator';

import { ApiException, type ValidationField } from '../errors/api-exception';
import { COMMON_ERRORS } from '../errors/common-errors';

const RULES = {
  isDefined: 'VALUE_REQUIRED',
  isNotEmpty: 'VALUE_REQUIRED',
  isString: 'STRING_REQUIRED',
  isInt: 'INTEGER_REQUIRED',
  isBoolean: 'BOOLEAN_REQUIRED',
  isArray: 'ARRAY_REQUIRED',
  isEmail: 'EMAIL_INVALID',
  isUuid: 'UUID_INVALID',
  isUrl: 'URL_INVALID',
  isTimeZone: 'TIMEZONE_INVALID',
  isDateOnly: 'DATE_INVALID',
  minLength: 'STRING_TOO_SHORT',
  maxLength: 'STRING_TOO_LONG',
  min: 'NUMBER_TOO_SMALL',
  max: 'NUMBER_TOO_LARGE',
  arrayMaxSize: 'ARRAY_TOO_LARGE',
  arrayNotEmpty: 'ARRAY_EMPTY',
  isIn: 'VALUE_NOT_ALLOWED',
  matches: 'FORMAT_INVALID',
  matchesProperty: 'FIELDS_DO_NOT_MATCH',
  whitelistValidation: 'PROPERTY_NOT_ALLOWED',
} as const;

export type ValidationRule =
  (typeof RULES)[keyof typeof RULES] | 'VALUE_INVALID';

// Translate validator identifiers, not their English messages, into public rules.
// Unknown identifiers still produce a safe, stable fallback.
function resolveRule(constraint: string): ValidationRule {
  for (const [name, rule] of Object.entries(RULES)) {
    if (name === constraint) return rule;
  }
  return 'VALUE_INVALID';
}

/**
 * Converts class-validator failures into our API validation error.
 * ValidationPipe calls this factory when a request fails DTO validation, then
 * throws the returned exception. The API exception filter sends it as HTTP 400.
 *
 * @param errors - Validation failures, including nested child failures.
 * @returns A VALIDATION_FAILED exception with field paths and stable rule codes.
 * Submitted values and validator messages are omitted. Unknown properties are
 * reported at their parent path; unknown rules become VALUE_INVALID.
 * The input is not modified, and this function returns rather than throws.
 * @example
 * const error = createValidationException([
 *   { property: 'email', constraints: { isEmail: 'email must be an email' } },
 * ]);
 * // error.getResponse():
 * // { statusCode: 400, code: 'VALIDATION_FAILED',
 * //   message: 'Request validation failed.',
 * //   details: { fields: [{ path: ['email'], rule: 'EMAIL_INVALID' }] } }
 */
export function createValidationException(
  errors: ValidationError[],
): ApiException {
  return new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
    fields: collectFields(errors),
  });
}

// Flatten the validation tree into field errors. Carry the parent path through
// recursion so nested array errors can identify fields such as ['blocks', 0, 'text'].
function collectFields(
  errors: ValidationError[],
  parent: ValidationField['path'] = [],
): ValidationField[] {
  return errors.flatMap((error) => {
    const constraints = Object.keys(error.constraints ?? {});
    // Unknown property names and unknown validation targets are submitted data.
    const path =
      constraints.includes('whitelistValidation') ||
      constraints.includes('unknownValue') ||
      !error.property
        ? parent
        : [
            ...parent,
            /^\d+$/.test(error.property)
              ? Number(error.property)
              : error.property,
          ];
    return [
      ...constraints.map((constraint) => ({
        path,
        rule: resolveRule(constraint),
      })),
      ...collectFields(error.children ?? [], path),
    ];
  });
}
