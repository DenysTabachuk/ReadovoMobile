import { palette } from '@/constants/palette';
import type { ThemeColors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingBottom: 0,
      paddingHorizontal: 0,
    },
    content: {
      gap: Spacing.lg,
      paddingBottom: 168,
      paddingHorizontal: Spacing.xLg,
      paddingTop: Spacing.lg,
    },
    headerIconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      marginRight: Spacing.sm,
      width: 44,
    },
    centerState: {
      alignItems: 'center',
      flex: 1,
      gap: Spacing.md,
      justifyContent: 'center',
    },
    scrollToCurrentSpeechButton: {
      alignItems: 'center',
      backgroundColor: colors.warningSurface,
      borderRadius: 999,
      elevation: 6,
      height: 52,
      justifyContent: 'center',
      position: 'absolute',
      right: Spacing.md,
      shadowColor: palette.black,
      shadowOffset: {
        height: 4,
        width: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      width: 52,
      zIndex: 30,
    },
  });
