import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconSymbol } from '@/components/iconSymbol';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';

import { createStyles } from './styles';

const ACTIVITIES = [
  {
    id: 'vocabulary',
    titleKey: 'learning.vocabulary.title',
    descriptionKey: 'learning.vocabulary.description',
    image: require('../../../../assets/images/learning/vocabulary.png'),
    available: false,
  },
  {
    id: 'grammar',
    titleKey: 'learning.grammar.title',
    descriptionKey: 'learning.grammar.description',
    image: require('../../../../assets/images/learning/grammar.png'),
    available: false,
  },
  {
    id: 'reading',
    titleKey: 'learning.reading.title',
    descriptionKey: 'learning.reading.description',
    image: require('../../../../assets/images/learning/reading.png'),
    available: true,
  },
] as const;

export default function LearningScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollableScreen edges={['top']} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="heroTitle">{t('learning.title')}</ThemedText>
        <ThemedText type="description" style={styles.description}>
          {t('learning.description')}
        </ThemedText>
      </View>

      <View style={styles.activities}>
        <ThemedText type="sectionTitle" accessibilityRole="header">
          {t('learning.chooseActivity')}
        </ThemedText>
        {ACTIVITIES.map((activity) => (
          <Pressable
            key={activity.id}
            accessibilityRole="button"
            accessibilityLabel={t(activity.titleKey)}
            accessibilityHint={t(activity.descriptionKey)}
            accessibilityState={{ disabled: !activity.available }}
            disabled={!activity.available}
            onPress={() => router.push('/(tabs)/(learning)/articles')}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <Image
              source={activity.image}
              contentFit="contain"
              style={styles.illustration}
              accessible={false}
            />
            <View style={styles.cardContent}>
              <ThemedText type="sectionTitle">
                {t(activity.titleKey)}
              </ThemedText>
              <ThemedText style={styles.cardDescription}>
                {t(activity.descriptionKey)}
              </ThemedText>
              {!activity.available && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {t('learning.comingSoon')}
                  </ThemedText>
                </View>
              )}
            </View>
            {activity.available && (
              <IconSymbol
                name="chevron.right"
                size={24}
                color={colors.interactive}
              />
            )}
          </Pressable>
        ))}
      </View>
    </ScrollableScreen>
  );
}
