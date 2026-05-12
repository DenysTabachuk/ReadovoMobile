import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  type ArticleAdaptationSummary,
  type WikipediaArticle,
} from '@/api/wikipedia';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/iconSymbol';

import { ArticleThumbnail } from '../articleThumbnail';
import { styles } from './styles';

type ArticleCardProps = {
  article: WikipediaArticle;
  borderColor: string;
  colorScheme: 'light' | 'dark' | null | undefined;
  expandedAdaptations: boolean;
  iconColor: string;
  isSaved: boolean;
  onOpen: (article: WikipediaArticle) => void;
  onToggleAdaptations: (articleId: number) => void;
  onToggleSaved: (article: WikipediaArticle) => void;
  savedAccentColor: string;
  tintColor: string;
  wasOpened: boolean;
};

export function ArticleCard({
  article,
  borderColor,
  colorScheme,
  expandedAdaptations,
  iconColor,
  isSaved,
  onOpen,
  onToggleAdaptations,
  onToggleSaved,
  savedAccentColor,
  tintColor,
  wasOpened,
}: ArticleCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onOpen(article)}
      style={({ pressed }) => [
        styles.articleCard,
        { borderColor },
        pressed ? styles.articleCardPressed : null,
      ]}>
      <ArticleThumbnail
        borderColor={borderColor}
        iconColor={iconColor}
        thumbnailUrl={article.thumbnailUrl}
        title={article.title}
      />

      <View style={styles.articleContent}>
        <View style={styles.articleTitleRow}>
          <ThemedText type="sectionTitle" style={styles.articleTitle}>
            {article.title}
          </ThemedText>
        </View>
        <ThemedText type="body" style={styles.articleExtract} numberOfLines={5}>
          {article.extract}
        </ThemedText>
        {article.availableAdaptations?.length ? (
          <View style={styles.adaptations}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onToggleAdaptations(article.id);
              }}
              style={styles.adaptationsToggle}>
              <ThemedText type="bodyStrong" style={styles.adaptationsToggleText}>
                {t('articles.textVersionsAvailable')}
              </ThemedText>
              <Ionicons color={tintColor} name="sparkles" size={15} />
              <Ionicons
                color={iconColor}
                name={expandedAdaptations ? 'chevron-up' : 'chevron-down'}
                size={16}
              />
            </Pressable>
            {expandedAdaptations ? (
              <View style={styles.adaptationsPanel}>
                {formatAdaptations(article.availableAdaptations).map((adaptationGroup) => (
                  <View key={adaptationGroup.level} style={styles.adaptationLevelRow}>
                    <ThemedText
                      type="description"
                      style={[
                        styles.adaptationLevelLabel,
                        getAdaptationLevelLabelStyle(
                          adaptationGroup.level,
                          colorScheme,
                        ),
                      ]}>
                      {adaptationGroup.level}
                    </ThemedText>
                    <View style={styles.adaptationBadges}>
                      {adaptationGroup.transformationTypes.map((transformationType) => (
                        <View
                          key={`${adaptationGroup.level}-${transformationType}`}
                          style={[
                            styles.adaptationBadge,
                            transformationType === 'adaptation'
                              ? [
                                  styles.transformationBadgeAdaptation,
                                  colorScheme === 'dark'
                                    ? styles.transformationBadgeAdaptationDark
                                    : null,
                                ]
                              : [
                                  styles.transformationBadgeSummary,
                                  colorScheme === 'dark'
                                    ? styles.transformationBadgeSummaryDark
                                    : null,
                                ],
                          ]}>
                          <ThemedText
                            type="description"
                            style={[
                              styles.adaptationBadgeText,
                              transformationType === 'adaptation'
                                ? [
                                    styles.transformationBadgeTextAdaptation,
                                    colorScheme === 'dark'
                                      ? styles.transformationBadgeTextAdaptationDark
                                      : null,
                                  ]
                                : [
                                    styles.transformationBadgeTextSummary,
                                    colorScheme === 'dark'
                                      ? styles.transformationBadgeTextSummaryDark
                                      : null,
                                  ],
                            ]}>
                            {transformationType === 'adaptation'
                              ? t('article.textMode.adapted')
                              : t('article.textMode.summary')}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.articleActionsColumn}>
        <Pressable
          accessibilityLabel={
            isSaved
              ? t('article.savedArticles.removeAction')
              : t('article.savedArticles.saveAction')
          }
          onPress={(event) => {
            event.stopPropagation();
            onToggleSaved(article);
          }}
          style={styles.cardBookmarkButton}>
          <IconSymbol
            color={isSaved ? savedAccentColor : iconColor}
            name={isSaved ? 'bookmark.fill' : 'bookmark'}
            size={22}
          />
        </Pressable>
        {wasOpened ? (
          <View
            accessibilityLabel={t('articles.recent.openedIndicator')}
            style={styles.openedIndicator}>
            <Ionicons
              color={colorScheme === 'dark' ? '#9ba1a6' : '#687076'}
              name="eye-outline"
              size={16}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatAdaptations(
  adaptations: ArticleAdaptationSummary[],
) {
  const groupedAdaptations = new Map<
    ArticleAdaptationSummary['level'],
    Set<ArticleAdaptationSummary['transformationType']>
  >();

  adaptations.forEach((adaptation) => {
    const currentGroup =
      groupedAdaptations.get(adaptation.level) ?? new Set();

    currentGroup.add(adaptation.transformationType);
    groupedAdaptations.set(adaptation.level, currentGroup);
  });

  return Array.from(groupedAdaptations.entries())
    .sort(([leftLevel], [rightLevel]) => leftLevel.localeCompare(rightLevel))
    .map(([level, transformationTypes]) => ({
      level,
      transformationTypes: Array.from(transformationTypes).sort(
        compareTransformationType,
      ),
    }));
}

function compareTransformationType(
  leftType: ArticleAdaptationSummary['transformationType'],
  rightType: ArticleAdaptationSummary['transformationType'],
): number {
  const transformationOrder = {
    adaptation: 0,
    summary: 1,
  } satisfies Record<ArticleAdaptationSummary['transformationType'], number>;

  return transformationOrder[leftType] - transformationOrder[rightType];
}

function getAdaptationLevelLabelStyle(
  level: ArticleAdaptationSummary['level'],
  colorScheme: ArticleCardProps['colorScheme'],
) {
  const isDark = colorScheme === 'dark';

  if (level === 'A1') {
    return isDark
      ? styles.adaptationLevelLabelA1Dark
      : styles.adaptationLevelLabelA1;
  }

  if (level === 'A2') {
    return isDark
      ? styles.adaptationLevelLabelA2Dark
      : styles.adaptationLevelLabelA2;
  }

  if (level === 'B1') {
    return isDark
      ? styles.adaptationLevelLabelB1Dark
      : styles.adaptationLevelLabelB1;
  }

  return isDark
    ? styles.adaptationLevelLabelB2Dark
    : styles.adaptationLevelLabelB2;
}
