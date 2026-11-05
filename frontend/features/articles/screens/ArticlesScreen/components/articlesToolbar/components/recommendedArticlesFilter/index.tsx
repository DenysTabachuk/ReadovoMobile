import { useTheme } from '@/hooks/use-theme';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { Pressable, Switch, View } from 'react-native';
import { createStyles as createSharedStyles } from '../../styles';

import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

import type { ArticlesToolbarProps } from '../../types';
type Props = Pick<
  ArticlesToolbarProps,
  'recommendedArticles' | 'onChangeRecommendedArticles'
>;
export function RecommendedArticlesFilter({
  recommendedArticles,
  onChangeRecommendedArticles,
}: Props) {
  const { colors } = useTheme();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const { t } = useTranslation();

  const [isRecommendedInfoOpen, setIsRecommendedInfoOpen] = useState(false);
  const openRecommendedInfo = () => setIsRecommendedInfoOpen(true);
  const closeRecommendedInfo = () => setIsRecommendedInfoOpen(false);
  return (
    <>
      <View style={[sharedStyles.sectionCard, sharedStyles.filterSurface]}>
        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              sharedStyles.controlSurface,
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
              <Ionicons
                color={colors.interactive}
                name="sparkles-outline"
                size={20}
              />
              <ThemedText type="bodyStrong">
                {t('articles.recommendedLabel')}
              </ThemedText>
            </View>
            <Switch
              onValueChange={onChangeRecommendedArticles}
              thumbColor={
                recommendedArticles ? colors.interactive : colors.surface
              }
              trackColor={{
                false: colors.borderStrong,
                true: colors.selection,
              }}
              value={recommendedArticles}
            />
          </View>
          <Pressable
            accessibilityLabel={t('articles.recommendedInfo.openAction')}
            onPress={openRecommendedInfo}
            style={[styles.infoButton, sharedStyles.controlSurface]}
          >
            <Ionicons
              color={colors.interactive}
              name="information-circle-outline"
              size={22}
            />
          </Pressable>
        </View>
      </View>
      <ModalSheet
        contentStyle={styles.recommendedInfoContent}
        onClose={closeRecommendedInfo}
        open={isRecommendedInfoOpen}
        title={t('articles.recommendedInfo.title')}
      >
        <ThemedText type="body" style={styles.recommendedInfoText}>
          {t('articles.recommendedInfo.description')}
        </ThemedText>
        <Button
          onPress={closeRecommendedInfo}
          style={styles.recommendedInfoButton}
        >
          {t('articles.recommendedInfo.thanks')}
        </Button>
      </ModalSheet>
    </>
  );
}
