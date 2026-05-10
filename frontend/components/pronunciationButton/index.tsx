import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/iconSymbol';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type PronunciationButtonProps = {
  word?: string;
};

export function PronunciationButton({ word }: PronunciationButtonProps) {
  const { t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isMountedRef = useRef(true);
  const labelColor = useThemeColor(
    {
      dark: '#0a7ea4',
      light: '#0a7ea4',
    },
    'tint',
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      void Speech.stop();
    };
  }, []);

  const handlePronounce = useCallback(async () => {
    const trimmedWord = word?.trim();

    if (!trimmedWord) {
      return;
    }

    try {
      await Speech.stop();
      setIsSpeaking(true);
      Speech.speak(trimmedWord, {
        language: 'en-US',
        onDone: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onStopped: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        pitch: 1,
        rate: 0.95,
      });
    } catch (error) {
      setIsSpeaking(false);
      console.error('[PronunciationButton] Failed to pronounce word', error);
    }
  }, [word]);

  return (
    <Pressable
      accessibilityLabel={t('translation.pronounceAction', {
        word: word ?? t('translation.titleFallback'),
      })}
      disabled={!word}
      onPress={handlePronounce}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.buttonPressed : null,
      ]}>
      <View style={styles.content}>
        <IconSymbol
          color={labelColor}
          name="speaker.wave.2.fill"
          size={18}
        />
        <ThemedText
          darkColor={labelColor}
          lightColor={labelColor}
          style={styles.label}
          type="bodyStrong">
          {isSpeaking ? t('translation.pronouncing') : t('translation.pronounce')}
        </ThemedText>
      </View>
    </Pressable>
  );
}
