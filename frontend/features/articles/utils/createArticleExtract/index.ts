const ARTICLE_EXTRACT_MAX_LENGTH = 180;
const ARTICLE_EXTRACT_ELLIPSIS = '...';

export function createArticleExtract(content: string): string {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (compactContent.length <= ARTICLE_EXTRACT_MAX_LENGTH) {
    return compactContent;
  }

  return `${compactContent.slice(0, ARTICLE_EXTRACT_MAX_LENGTH - ARTICLE_EXTRACT_ELLIPSIS.length).trim()}${ARTICLE_EXTRACT_ELLIPSIS}`;
}
