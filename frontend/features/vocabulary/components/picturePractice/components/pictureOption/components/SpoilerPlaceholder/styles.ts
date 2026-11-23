import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';
import { withOpacity } from '@/utils/withOpacity';

const PARTICLE_OPACITY = 0.78;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    field: {
      ...StyleSheet.absoluteFillObject,
      marginVertical: Spacing.sm,
      overflow: 'hidden',
    },
    // Keep the orbit and the largest particle inside the field at every edge.
    layer: { ...StyleSheet.absoluteFillObject, margin: 7 },
    particle: {
      position: 'absolute',
      borderRadius: 2,
      backgroundColor: withOpacity(colors.text, PARTICLE_OPACITY),
    },
  });
