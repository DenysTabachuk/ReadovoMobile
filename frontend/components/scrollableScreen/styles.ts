import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xLg,
    paddingTop: Spacing.xLg,
    paddingBottom: Spacing.xxLg,
  },
});
