import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconSymbol } from '@/components/iconSymbol';
import { ThemedText } from '@/components/themedText';
import {
  type ArticleAdaptationSummary,
  type WikipediaArticle,
} from '@/features/articles/api';

import { ArticleThumbnail } from '../articleThumbnail';
import { createStyles } from './styles';

type ArticleCardProps = {
  article: WikipediaArticle;
  borderColor: string;
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onOpen(article)}
      style={({ pressed }) => [
        styles.articleCard,
        { borderColor },
        pressed ? styles.articleCardPressed : null,
      ]}
    >
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
              style={styles.adaptationsToggle}
            >
              <ThemedText
                type="bodyStrong"
                style={styles.adaptationsToggleText}
              >
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
                {formatAdaptations(article.availableAdaptations).map(
                  (adaptationGroup) => (
                    <View
                      key={adaptationGroup.level}
                      style={styles.adaptationLevelRow}
                    >
                      <ThemedText
                        type="description"
                        style={[
                          styles.adaptationLevelLabel,
                          getAdaptationLevelLabelStyle(
                            adaptationGroup.level,
                            styles,
                          ),
                        ]}
                      >
                        {adaptationGroup.level}
                      </ThemedText>
                      <View style={styles.adaptationBadges}>
                        {adaptationGroup.transformationTypes.map(
                          (transformationType) => (
                            <View
                              key={`${adaptationGroup.level}-${transformationType}`}
                              style={[
                                styles.adaptationBadge,
                                transformationType === 'adaptation'
                                  ? [styles.transformationBadgeAdaptation]
                                  : [styles.transformationBadgeSummary],
                              ]}
                            >
                              <ThemedText
                                type="description"
                                style={[
                                  styles.adaptationBadgeText,
                                  transformationType === 'adaptation'
                                    ? [styles.transformationBadgeTextAdaptation]
                                    : [styles.transformationBadgeTextSummary],
                                ]}
                              >
                                {transformationType === 'adaptation'
                                  ? t('article.textMode.adapted')
                                  : t('article.textMode.summary')}
                              </ThemedText>
                            </View>
                          ),
                        )}
                      </View>
                    </View>
                  ),
                )}
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
          style={styles.cardBookmarkButton}
        >
          <IconSymbol
            color={isSaved ? savedAccentColor : iconColor}
            name={isSaved ? 'bookmark.fill' : 'bookmark'}
            size={22}
          />
        </Pressable>
        {wasOpened ? (
          <View
            accessibilityLabel={t('articles.recent.openedIndicator')}
            style={styles.openedIndicator}
          >
            <Ionicons
              color={colors.textSecondary}
              name="eye-outline"
              size={16}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatAdaptations(adaptations: ArticleAdaptationSummary[]) {
  const groupedAdaptations = new Map<
    ArticleAdaptationSummary['level'],
    Set<ArticleAdaptationSummary['transformationType']>
  >();

  adaptations.forEach((adaptation) => {
    const currentGroup = groupedAdaptations.get(adaptation.level) ?? new Set();

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
  styles: ReturnType<typeof createStyles>,
) {
  if (level === 'A1') {
    return styles.adaptationLevelLabelA1;
  }

  if (level === 'A2') {
    return styles.adaptationLevelLabelA2;
  }

  if (level === 'B1') {
    return styles.adaptationLevelLabelB1;
  }

  return styles.adaptationLevelLabelB2;
}
