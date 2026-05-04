import { Video, ResizeMode } from 'expo-av';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type QuizSessionResult } from '@/components/articleQuizRunner';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type TestResultProps = {
  onDone: () => void;
  onRetry: () => void;
  result: QuizSessionResult;
  shouldShowTitle?: boolean;
  shouldUseSafeAreaBottom?: boolean;
  title: string;
};

type ResultTier = 'good' | 'normal' | 'poor';

export function TestResult({
  onDone,
  onRetry,
  result,
  shouldShowTitle = true,
  shouldUseSafeAreaBottom = true,
  title,
}: TestResultProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const tier = resolveResultTier(result.percentage);
  const animationSource = resolveAnimationSource(tier, colorScheme);
  const message = resolveResultMessage(tier, t);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.orbContainer}>
          <View style={styles.purpleGlowFar} />
          <View style={styles.purpleGlowOuter} />
          <View style={styles.purpleGlowMid} />
          <View style={styles.purpleGlowInner} />
          <View style={styles.purpleGlowCore} />
          <View style={styles.videoMask}>
          <Video
            isLooping
            isMuted
            shouldPlay
            resizeMode={ResizeMode.CONTAIN}
            source={animationSource}
            style={[styles.backgroundVideo, { backgroundColor: palette.background }]}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {shouldShowTitle ? (
          <ThemedText type="screenTitle" style={styles.title}>
            {title}
          </ThemedText>
        ) : null}

        <View style={styles.scoreOrbContainer}>
          <View style={[styles.scoreGlowOuter, resolveTierScoreGlowStyle(tier).outer]} />
          <View style={[styles.scoreGlowMid, resolveTierScoreGlowStyle(tier).mid]} />
          <View style={[styles.scoreGlowInner, resolveTierScoreGlowStyle(tier).inner]} />
          <View style={[styles.scoreCircle, resolveTierRingStyle(tier)]}>
            <ThemedText style={styles.scoreValue}>{`${result.percentage}%`}</ThemedText>
            <ThemedText type="sectionTitle" style={styles.messageTitle}>
              {message.title}
            </ThemedText>
            <ThemedText type="body" style={styles.messageSubtitle}>
              {message.subtitle}
            </ThemedText>
          </View>
        </View>

      </View>

      <View
        style={[
          styles.actions,
          { paddingBottom: shouldUseSafeAreaBottom ? Math.max(insets.bottom, 8) : 8 },
        ]}>
        <Button onPress={onDone} style={styles.actionButton}>
          {t('dictionary.test.done', { defaultValue: 'Done' })}
        </Button>
        <Button onPress={onRetry} style={styles.actionButton} variant="secondary">
          {t('dictionary.test.retry', { defaultValue: 'Try the test again' })}
        </Button>
      </View>
    </View>
  );
}

function resolveResultTier(percentage: number): ResultTier {
  if (percentage >= 80) {
    return 'good';
  }

  if (percentage >= 50) {
    return 'normal';
  }

  return 'poor';
}

function resolveAnimationSource(
  tier: ResultTier,
  colorScheme: ReturnType<typeof useColorScheme>,
) {
  const isDark = colorScheme === 'dark';

  if (tier === 'good') {
    return isDark
      ? require('@/assets/images/happy-octopus-dark-theme.mp4')
      : require('@/assets/images/happy-octopus-light-theme.mp4');
  }

  if (tier === 'normal') {
    return isDark
      ? require('@/assets/images/waving-octopus-dark-theme.mp4')
      : require('@/assets/images/waving-octopus-light-theme.mp4');
  }

  return isDark
    ? require('@/assets/images/crying-octopus-dark-theme.mp4')
    : require('@/assets/images/crying-octopus-light-theme.mp4');
}

function resolveResultMessage(
  tier: ResultTier,
  t: ReturnType<typeof useTranslation>['t'],
): { subtitle: string; title: string } {
  if (tier === 'good') {
    return {
      subtitle: t('dictionary.test.resultGoodSubtitle', {
        defaultValue: 'You handled the test really well',
      }),
      title: t('dictionary.test.resultGoodTitle', {
        defaultValue: 'Great job!',
      }),
    };
  }

  if (tier === 'normal') {
    return {
      subtitle: t('dictionary.test.resultNormalSubtitle', {
        defaultValue: 'Nice work, a bit more practice and you will do even better',
      }),
      title: t('dictionary.test.resultNormalTitle', {
        defaultValue: 'Good result',
      }),
    };
  }

  return {
    subtitle: t('dictionary.test.resultPoorSubtitle', {
      defaultValue: 'Try again to improve your result',
    }),
    title: t('dictionary.test.resultPoorTitle', {
      defaultValue: 'More practice needed',
    }),
  };
}

function resolveTierRingStyle(tier: ResultTier) {
  if (tier === 'good') {
    return styles.goodRing;
  }

  if (tier === 'normal') {
    return styles.normalRing;
  }

  return styles.poorRing;
}

function resolveTierScoreGlowStyle(tier: ResultTier): {
  inner: object;
  mid: object;
  outer: object;
} {
  if (tier === 'good') {
    return {
      inner: styles.scoreGlowGoodInner,
      mid: styles.scoreGlowGoodMid,
      outer: styles.scoreGlowGoodOuter,
    };
  }

  if (tier === 'normal') {
    return {
      inner: styles.scoreGlowNormalInner,
      mid: styles.scoreGlowNormalMid,
      outer: styles.scoreGlowNormalOuter,
    };
  }

  return {
    inner: styles.scoreGlowPoorInner,
    mid: styles.scoreGlowPoorMid,
    outer: styles.scoreGlowPoorOuter,
  };
}
