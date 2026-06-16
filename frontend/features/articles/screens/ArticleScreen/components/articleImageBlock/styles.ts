import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  caption: {
    opacity: 0.75,
  },
  container: {
    gap: Spacing.sm,
  },
  fallback: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 220,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xLg,
    width: '100%',
  },
  fallbackText: {
    opacity: 0.8,
    textAlign: 'center',
  },
  fallbackTitle: {
    textAlign: 'center',
  },
  image: {
    borderRadius: 12,
    height: 220,
    width: '100%',
  },
  viewer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  viewerCaption: {
    bottom: Spacing.xLg,
    left: Spacing.xLg,
    opacity: 0.9,
    position: 'absolute',
    right: Spacing.xLg,
    textAlign: 'center',
  },
  viewerCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.xLg,
    width: 44,
    zIndex: 2,
  },
  viewerFallbackTitle: {
    paddingHorizontal: Spacing.xLg,
    textAlign: 'center',
  },
  viewerImage: {
    height: '100%',
    width: '100%',
  },
  viewerImageWrapper: {
    height: '100%',
    width: '100%',
  },
  viewerLoading: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  viewerRoot: {
    flex: 1,
  },
});
