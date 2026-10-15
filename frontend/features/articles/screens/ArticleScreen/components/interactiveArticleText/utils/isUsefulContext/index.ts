const MIN_USEFUL_CONTEXT_LENGTH = 24;

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
