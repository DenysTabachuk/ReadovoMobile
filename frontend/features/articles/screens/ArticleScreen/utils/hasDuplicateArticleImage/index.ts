import type { ArticleBlock } from '@/features/articles/api';

/**
 * Detect whether the hero thumbnail already appears in the article content.
 *
 * Wikipedia thumbnail paths and original image paths can refer to the same file at
 * different sizes; this compares identities rather than full URLs.
 *
 * @param thumbnailUrl - Hero image URL to compare.
 * @param blocks - Article blocks that may contain the same image.
 * @returns True when an image block resolves to the same normalized filename; false when no
 *   match is found.
 * @example
 * hasDuplicateArticleImage('https://example.com/thumb/a/ab/Moon.jpg/200px-Moon.jpg', [
 *   { type: 'image', src: 'https://example.com/a/ab/Moon.jpg' },
 * ]);
 * // => true
 */
export function hasDuplicateArticleImage(
  thumbnailUrl: string,
  blocks: ArticleBlock[],
): boolean {
  const normalizedThumbnailIdentity = getWikipediaImageIdentity(thumbnailUrl);

  if (!normalizedThumbnailIdentity) {
    return false;
  }

  return blocks.some((block) => {
    return (
      block.type === 'image' &&
      getWikipediaImageIdentity(block.src) === normalizedThumbnailIdentity
    );
  });
}

function getWikipediaImageIdentity(imageUrl: string): string | null {
  try {
    const { pathname } = new URL(imageUrl);
    const pathSegments = pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return null;
    }

    const thumbIndex = pathSegments.findIndex((segment) => segment === 'thumb');
    // Thumbnail URLs end with a resized filename; the preceding segment is the original file.
    const rawFileName =
      thumbIndex >= 0 && thumbIndex + 3 < pathSegments.length
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

    if (!rawFileName) {
      return null;
    }

    return decodeURIComponent(rawFileName)
      .replace(/^\d+px-/, '')
      .trim()
      .toLowerCase();
  } catch {
    return imageUrl.trim().toLowerCase() || null;
  }
}
