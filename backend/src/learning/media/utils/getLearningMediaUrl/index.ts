import {
  LEARNING_IMAGE_KEY,
  LEARNING_MEDIA_PATH,
  MAX_MEDIA_KEY_LENGTH,
} from '../../constants';

/**
 * Builds a protected API URL for artwork the media route can serve.
 * @param key The stored object key or null when no artwork is configured.
 * @returns An API-relative URL, or null for a missing or unsupported key.
 * @example
 * getLearningMediaUrl('learning/topics/germany/v1.png');
 * // => '/learning/media?key=learning%2Ftopics%2Fgermany%2Fv1.png'
 */
export function getLearningMediaUrl(key: string | null): string | null {
  if (
    key === null ||
    key.length > MAX_MEDIA_KEY_LENGTH ||
    !LEARNING_IMAGE_KEY.test(key)
  )
    return null;

  return `/${LEARNING_MEDIA_PATH}?key=${encodeURIComponent(key)}`;
}
