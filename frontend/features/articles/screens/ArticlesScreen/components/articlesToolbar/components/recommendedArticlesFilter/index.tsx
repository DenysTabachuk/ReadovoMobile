import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, View } from 'react-native';
import { styles as sharedStyles } from '../../styles';

import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

import { useArticlesFilterTheme } from '../../hooks/useArticlesFilterTheme';
import type { ArticlesToolbarProps } from '../../types';
type Props = Pick<
  ArticlesToolbarProps,
  'recommendedArticles' | 'onChangeRecommendedArticles'
>;
export function RecommendedArticlesFilter({
  recommendedArticles,
  onChangeRecommendedArticles,
}: Props) {
  const { t } = useTranslation();
  const {
    isDarkMode,
    borderColor,
    cardColor,
    sectionCardColor,
    tintColor,
    selectedCategoryBackground,
  } = useArticlesFilterTheme();
  const [isRecommendedInfoOpen, setIsRecommendedInfoOpen] = useState(false);
  const openRecommendedInfo = () => setIsRecommendedInfoOpen(true);
  const closeRecommendedInfo = () => setIsRecommendedInfoOpen(false);
  return (
    <>
      <View
        style={[
          sharedStyles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}
      >
        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
              <Ionicons
                color={isDarkMode ? '#c4a7ff' : tintColor}
                name="sparkles-outline"
                size={20}
              />
              <ThemedText type="bodyStrong">
                {t('articles.recommendedLabel')}
              </ThemedText>
            </View>
            <Switch
              onValueChange={onChangeRecommendedArticles}
              thumbColor={recommendedArticles ? tintColor : '#f4f3f4'}
              trackColor={{
                false: '#767577',
                true: selectedCategoryBackground,
              }}
              value={recommendedArticles}
            />
          </View>
          <Pressable
            accessibilityLabel={t('articles.recommendedInfo.openAction')}
            onPress={openRecommendedInfo}
            style={[
              styles.infoButton,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <Ionicons
              color={isDarkMode ? '#c4a7ff' : tintColor}
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
