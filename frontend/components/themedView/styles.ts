import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { backgroundColor: colors.background },
  });
