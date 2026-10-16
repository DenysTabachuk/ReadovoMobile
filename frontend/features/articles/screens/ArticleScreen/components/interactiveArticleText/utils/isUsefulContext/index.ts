const MIN_USEFUL_CONTEXT_LENGTH = 24;

/**
 * Check whether a translation context is long enough and contains the selected word.
 *
 * The parentheses check detects leftover opening parentheses, not every possible
 * punctuation imbalance.
 *
 * @param context - Candidate sentence or context text.
 * @param word - Selected word or phrase to find, ignoring case.
 * @returns True for context of at least 24 characters that contains the word and has no
 *   unmatched opening parentheses.
 * @example
 * isUsefulContext('The quick brown fox jumps over the dog.', 'fox');
 * // => true
 */
export function isUsefulContext(context: string, word: string): boolean {
  if (
    !context ||
    context.length < Math.max(MIN_USEFUL_CONTEXT_LENGTH, word.length)
  ) {
    return false;
  }

  if (hasUnbalancedParentheses(context)) {
    return false;
  }

  return context.toLowerCase().includes(word.toLowerCase());
}

function hasUnbalancedParentheses(context: string): boolean {
  let balance = 0;

  for (const character of context) {
    if (character === '(') {
      balance += 1;
      continue;
    }

    if (character === ')') {
      balance = Math.max(0, balance - 1);
    }
  }

  return balance > 0;
}
