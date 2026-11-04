import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';
import { Typography } from '@/constants/typography';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    ...Typography,
    baseText: { color: colors.text },
    link: { ...Typography.link, color: colors.link },
  });
