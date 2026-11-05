import type { ComponentProps } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

import { ScreenContainer } from '@/components/screenContainer';
import { styles } from './styles';

type ScrollableScreenProps = ScrollViewProps & {
  edges?: ComponentProps<typeof ScreenContainer>['edges'];
  containerStyle?: ComponentProps<typeof ScreenContainer>['style'];
};

/**
 * A safe-area screen with scrolling content and shared screen padding.
 * Content styles may override spacing or add a screen-specific width limit.
 */
export function ScrollableScreen({
  children,
  edges,
  containerStyle,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  ...scrollViewProps
}: ScrollableScreenProps) {
  return (
    <ScreenContainer edges={edges} style={[styles.container, containerStyle]}>
      <ScrollView
        {...scrollViewProps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </ScreenContainer>
  );
}
