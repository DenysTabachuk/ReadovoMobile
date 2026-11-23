export const LEARNING_MEDIA_PATH = 'learning/media';
export const MAX_MEDIA_KEY_LENGTH = 200;
export const LEARNING_IMAGE_KEY =
  /^(?:learning\/(?:topics|lessons|art)|vocabulary)\/(?:[a-z0-9-]+\/)+v[1-9][0-9]*\.(?:png|webp)$/;
export const LEARNING_IMAGE_TYPES = {
  png: 'image/png',
  webp: 'image/webp',
} as const;
export const LEARNING_MEDIA_URL_PATTERN = '^/learning/media\\?key=\\S+$';
export const DEFAULT_LEARNING_COVER_KEY = 'learning/art/discover-topics/v1.png';
export const READING_CHECK_IMAGE_KEY = 'learning/art/reading-check/v1.png';
