export function getHeadingTypographyType(level: 1 | 2 | 3) {
  if (level === 1) {
    return 'screenTitle' as const;
  }

  if (level === 2) {
    return 'sectionTitle' as const;
  }

  return 'bodyStrong' as const;
}
