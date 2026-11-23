import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

const TOPIC_COVER_ASPECT_RATIO = 2.2;
const LESSON_ACTION_WIDTH = 44;
const LESSON_THUMBNAIL_SIZE = 68;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    pressed: { opacity: 0.9 },
    cover: { width: '100%', aspectRatio: TOPIC_COVER_ASPECT_RATIO },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      padding: Spacing.xLg,
    },
    copy: { flex: 1, gap: Spacing.sm },
    secondary: { color: colors.textSecondary },
    lesson: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 16,
    },
    lessonLink: {
      flex: 1,
      minHeight: 88,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      paddingRight: LESSON_ACTION_WIDTH,
    },
    lessonCopy: { flex: 1, minWidth: 0, gap: Spacing.xs },
    lessonDetail: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
    thumbnail: {
      width: LESSON_THUMBNAIL_SIZE,
      height: LESSON_THUMBNAIL_SIZE,
      borderRadius: 10,
    },
    bookmark: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: LESSON_ACTION_WIDTH,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: LESSON_ACTION_WIDTH,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completed: { color: colors.success },
  });
