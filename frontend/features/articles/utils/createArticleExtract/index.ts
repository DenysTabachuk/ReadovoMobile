const ARTICLE_EXTRACT_MAX_LENGTH = 180;
const ARTICLE_EXTRACT_ELLIPSIS = '...';

/**
 * Create a compact article preview for saved and recent article cards.
 *
 * @param content - Full article content.
 * @returns Whitespace-normalized text of at most 180 characters, ending with ... when
 *   truncated; blank input yields an empty string.
 * @example
 * createArticleExtract('  Hello\n world!  ');
 * // => 'Hello world!'
 */
export function createArticleExtract(content: string): string {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (compactContent.length <= ARTICLE_EXTRACT_MAX_LENGTH) {
    return compactContent;
  }

  return `${compactContent.slice(0, ARTICLE_EXTRACT_MAX_LENGTH - ARTICLE_EXTRACT_ELLIPSIS.length).trim()}${ARTICLE_EXTRACT_ELLIPSIS}`;
}
