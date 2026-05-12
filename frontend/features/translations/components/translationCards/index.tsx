import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type TranslationCardsProps = {
  baseTranslation?: string;
  context?: string;
  contextTranslation?: string;
  contextualTranslation?: string;
  isContextLoading?: boolean;
  resetKey?: string;
  translation?: string;
};

export function TranslationCards({
  baseTranslation,
  context,
  contextTranslation,
  contextualTranslation,
  isContextLoading = false,
  resetKey,
  translation,
}: TranslationCardsProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [showContextualWordTranslation, setShowContextualWordTranslation] =
    useState(false);
  const [showTranslatedContext, setShowTranslatedContext] = useState(false);
  const wordFadeAnimation = useRef(new Animated.Value(1)).current;
  const contextFadeAnimation = useRef(new Animated.Value(1)).current;
  const resolvedBaseTranslation = baseTranslation ?? translation;
  const canToggleWordTranslation = Boolean(
    resolvedBaseTranslation &&
      contextualTranslation &&
      resolvedBaseTranslation !== contextualTranslation,
  );
  const displayedWordTranslation =
    showContextualWordTranslation && contextualTranslation
      ? contextualTranslation
      : resolvedBaseTranslation;

  useEffect(() => {
    setShowContextualWordTranslation(false);
    setShowTranslatedContext(false);
  }, [context, contextTranslation, contextualTranslation, resetKey]);

  return (
    <>
      {displayedWordTranslation ? (
        <Pressable
          disabled={!canToggleWordTranslation}
          onPress={() => {
            Animated.sequence([
              Animated.timing(wordFadeAnimation, {
                duration: 140,
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.timing(wordFadeAnimation, {
                duration: 160,
                toValue: 1,
                useNativeDriver: true,
              }),
            ]).start();
            setShowContextualWordTranslation((previousState) => !previousState);
          }}
          style={styles.translationCard}>
          <ThemedText type="description" style={styles.cardLabel}>
            {showContextualWordTranslation && contextualTranslation
              ? t('translation.wordTranslationContextualLabel')
              : t('translation.wordTranslationLabel')}
          </ThemedText>
          <Animated.View style={{ opacity: wordFadeAnimation }}>
            <ThemedText type="paragraph" style={styles.cardText}>
              {displayedWordTranslation}
            </ThemedText>
          </Animated.View>
        </Pressable>
      ) : null}
      {canToggleWordTranslation ? (
        <View style={styles.wordHint}>
          <Ionicons
            color={Colors[colorScheme ?? 'light'].icon}
            name="swap-horizontal-outline"
            size={14}
          />
          <ThemedText type="description" style={styles.contextHintText}>
            {t('translation.wordTapHint')}
          </ThemedText>
        </View>
      ) : null}

      {context ? (
        <View style={styles.contextSection}>
          <Pressable
            disabled={!contextTranslation || isContextLoading}
            onPress={() => {
              Animated.sequence([
                Animated.timing(contextFadeAnimation, {
                  duration: 140,
                  toValue: 0,
                  useNativeDriver: true,
                }),
                Animated.timing(contextFadeAnimation, {
                  duration: 160,
                  toValue: 1,
                  useNativeDriver: true,
                }),
              ]).start();
              setShowTranslatedContext((previousState) => !previousState);
            }}
            style={styles.contextCard}>
            <ThemedText type="description" style={styles.cardLabel}>
              {showTranslatedContext && contextTranslation
                ? t('translation.contextTranslationLabel')
                : t('translation.contextOriginalLabel')}
            </ThemedText>
            <Animated.View style={{ opacity: contextFadeAnimation }}>
              <ThemedText type="body" style={styles.cardText}>
                {showTranslatedContext && contextTranslation
                  ? contextTranslation
                  : context}
              </ThemedText>
            </Animated.View>
          </Pressable>
          <View style={styles.contextHint}>
            <Ionicons
              color={Colors[colorScheme ?? 'light'].icon}
              name="swap-horizontal-outline"
              size={14}
            />
            <ThemedText type="description" style={styles.contextHintText}>
              {t('translation.contextTapHint')}
            </ThemedText>
          </View>
        </View>
      ) : null}
    </>
  );
}
