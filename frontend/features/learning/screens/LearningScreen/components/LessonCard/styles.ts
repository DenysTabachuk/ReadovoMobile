import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

const LESSON_ACTION_SIZE = 44;
const LESSON_THUMBNAIL_SIZE = 80;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    pressed: { opacity: 0.9 },
    link: {
      flex: 1,
      minHeight: 88,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      paddingRight: LESSON_ACTION_SIZE,
    },
    copy: { flex: 1, minWidth: 0, gap: Spacing.xs },
    detail: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
    thumbnail: {
      width: LESSON_THUMBNAIL_SIZE,
      height: LESSON_THUMBNAIL_SIZE,
      borderRadius: 8,
    },
    thumbnailFallback: { alignItems: 'center', justifyContent: 'center' },
    bookmark: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: LESSON_ACTION_SIZE,
      minHeight: LESSON_ACTION_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: LESSON_ACTION_SIZE,
      height: LESSON_ACTION_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completed: { color: colors.success },
  });
