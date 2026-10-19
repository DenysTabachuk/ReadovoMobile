import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import type { useArticleSpeech } from '../../../../useArticleSpeech';
import { ArticleSpeechControls } from '../../../articleSpeechControls';
import { styles } from './styles';
type Props = {
  articleSpeech: ReturnType<typeof useArticleSpeech>;
  visible: boolean;
};

const FLOATING_SPEECH_CONTROLS_HIDDEN_OFFSET = -120;
const FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS = 220;
const FLOATING_SPEECH_CONTROLS_SPRING = {
  damping: 18,
  mass: 0.8,
  stiffness: 180,
};

export function FloatingSpeechControls({
  articleSpeech,
  visible: shouldShowFloatingSpeechControls,
}: Props) {
  const colorScheme = useColorScheme();
  const [
    isFloatingSpeechControlsRendered,
    setIsFloatingSpeechControlsRendered,
  ] = useState(false);
  const floatingSpeechControlsOpacity = useRef(new Animated.Value(0)).current;
  const floatingSpeechControlsTranslateY = useRef(
    new Animated.Value(FLOATING_SPEECH_CONTROLS_HIDDEN_OFFSET),
  ).current;
  useEffect(() => {
    if (shouldShowFloatingSpeechControls) {
      setIsFloatingSpeechControlsRendered(true);
    }

    const animation = Animated.parallel([
      Animated.timing(floatingSpeechControlsOpacity, {
        duration: FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS,
        toValue: shouldShowFloatingSpeechControls ? 1 : 0,
        useNativeDriver: true,
      }),
      shouldShowFloatingSpeechControls
        ? Animated.spring(floatingSpeechControlsTranslateY, {
            ...FLOATING_SPEECH_CONTROLS_SPRING,
            toValue: 0,
            useNativeDriver: true,
          })
        : Animated.timing(floatingSpeechControlsTranslateY, {
            duration: FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS,
            toValue: FLOATING_SPEECH_CONTROLS_HIDDEN_OFFSET,
            useNativeDriver: true,
          }),
    ]);
    animation.start(({ finished }) => {
      if (finished && !shouldShowFloatingSpeechControls) {
        setIsFloatingSpeechControlsRendered(false);
      }
    });
    return () => animation.stop();
  }, [
    floatingSpeechControlsOpacity,
    floatingSpeechControlsTranslateY,
    shouldShowFloatingSpeechControls,
  ]);

  return isFloatingSpeechControlsRendered ? (
    <Animated.View
      style={[
        styles.floatingSpeechControls,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
        {
          opacity: floatingSpeechControlsOpacity,
          transform: [{ translateY: floatingSpeechControlsTranslateY }],
        },
      ]}
    >
      <ArticleSpeechControls
        disabled={!articleSpeech.canSpeak}
        onRestart={articleSpeech.restart}
        onStop={() => {
          void articleSpeech.stop();
        }}
        onTogglePlayPause={articleSpeech.togglePlayPause}
        progress={articleSpeech.progress}
        status={articleSpeech.status}
      />
    </Animated.View>
  ) : null;
}
