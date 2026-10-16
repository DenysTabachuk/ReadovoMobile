/**
 * Map article heading depth to the matching text typography.
 *
 * @param level - Supported heading depth: 1, 2, or 3.
 * @returns screenTitle for level 1, sectionTitle for level 2, or bodyStrong for level 3.
 * @example
 * getHeadingTypographyType(2);
 * // => 'sectionTitle'
 */
export function getHeadingTypographyType(level: 1 | 2 | 3) {
  if (level === 1) {
    return 'screenTitle' as const;
  }

  if (level === 2) {
    return 'sectionTitle' as const;
  }

  return 'bodyStrong' as const;
}
