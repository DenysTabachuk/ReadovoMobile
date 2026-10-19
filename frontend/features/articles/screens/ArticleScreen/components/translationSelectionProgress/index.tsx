import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TRANSLATION_SHEET_OPEN_DELAY_MS } from '../../constants';
import { styles } from './styles';

type TranslationSelectionProgressProps = { selectionKey: string };

export function TranslationSelectionProgress({
  selectionKey,
}: TranslationSelectionProgressProps) {
  const tintColor = useThemeColor({}, 'tint');
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: TRANSLATION_SHEET_OPEN_DELAY_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, selectionKey]);
  // Animate inside this small component instead of updating the entire reader every 50 ms.
  return (
    <View style={styles.translationProgressTrack}>
      <Animated.View
        style={[
          styles.translationProgressFill,
          {
            backgroundColor: tintColor,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}
