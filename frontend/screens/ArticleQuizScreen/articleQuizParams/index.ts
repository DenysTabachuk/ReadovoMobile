import { type SimplifyArticleLevel } from '@/api/wikipedia';

import { type ArticleQuizLengthParam } from '../types';

export function normalizeLevel(value?: string): SimplifyArticleLevel | null {
  if (value === 'A1' || value === 'A2' || value === 'B1' || value === 'B2') {
    return value;
  }

  return null;
}

export function normalizeTargetLength(
  value?: string,
): ArticleQuizLengthParam | null {
  if (value === 'original') {
    return value;
  }

  if (value === 'short' || value === 'medium' || value === 'long') {
    return value;
  }

  return null;
}
