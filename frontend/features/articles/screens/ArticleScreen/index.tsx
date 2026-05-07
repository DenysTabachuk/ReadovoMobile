import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { translateWord } from '@/api/translations';
import { createDictionaryWord } from '@/api/dictionary';
import {
  type ArticleBlock,
  fetchWikipediaArticleDetail,
  generateArticleQuiz,
  type SimplifyArticleLevel,
  simplifyWikipediaArticle,
  type SimplifyArticleResponse,
} from '@/api/wikipedia';
import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { Cta } from '@/components/cta';
import { ModalSheet } from '@/components/modalSheet';
import { OptionPickerField } from '@/components/optionPickerField';
import { ScreenContainer } from '@/components/screenContainer';
import { SegmentedToggle } from '@/components/segmentedToggle';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/iconSymbol';
import { Colors } from '@/constants/theme';
import {
  createRecentArticleFromDetail,
  createSavedArticleFromDetail,
  createSavedArticlesWithArticle,
  isArticleSaved,
  recordRecentArticle,
  readSavedArticles,
  removeSavedArticle,
  RECENT_ARTICLES_QUERY_KEY,
  saveArticleForLater,
  SAVED_ARTICLES_QUERY_KEY,
  getArticleQuizSessionKey,
  type SavedArticle,
} from '@/features/articles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { InteractiveArticleText } from './components/interactiveArticleText';
import { WordTranslationSheet } from './components/wordTranslationSheet';
import { styles } from './styles';

type SelectedWord = {
  context: string;
  tokenKey: string;
  word: string;
};
type ArticleTextLengthOption = '10' | '25' | '50' | 'original';

const DEFAULT_SIMPLIFICATION_LEVEL: SimplifyArticleLevel = 'A2';
const DEFAULT_TARGET_PERCENT: ArticleTextLengthOption = '25';

export default function ArticleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const savedAccentColor = colorScheme === 'dark' ? '#c4a7ff' : tintColor;
  const { showBanner } = useBanner();
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [adaptedArticle, setAdaptedArticle] = useState<SimplifyArticleResponse | null>(null);
  const [showAdaptedText, setShowAdaptedText] = useState(false);
  const [hasImageLoadError, setHasImageLoadError] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SimplifyArticleLevel>(
    DEFAULT_SIMPLIFICATION_LEVEL,
  );
  const [selectedTargetLength, setSelectedTargetLength] =
    useState<ArticleTextLengthOption>(DEFAULT_TARGET_PERCENT);
  const [isAdaptSettingsOpen, setIsAdaptSettingsOpen] = useState(false);
  const [isQuizModePickerOpen, setIsQuizModePickerOpen] = useState(false);

  const rawArticleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedArticleId = Number(rawArticleId);
  const articleId = Number.isFinite(parsedArticleId) ? parsedArticleId : null;

  const {
    data: article,
    error,
    isLoading,
    refetch,
  } = useQuery({
    enabled: articleId !== null,
    queryFn: async () => {
      if (articleId === null) {
        throw new Error('article.invalidId');
      }

      return fetchWikipediaArticleDetail(articleId);
    },
    queryKey: ['wikipedia', 'article', articleId],
  });
  const {
    data: translation,
    error: translationError,
    isFetching: isTranslationLoading,
  } = useQuery({
    enabled: selectedWord !== null,
    queryFn: async () => {
      if (!selectedWord) {
        throw new Error('translation.error');
      }

      return translateWord({
        context: selectedWord.context,
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        word: selectedWord.word,
      });
    },
    queryKey: [
      'translation',
      selectedWord?.word ?? '',
      selectedWord?.context ?? '',
      'en',
      'uk',
    ],
  });
  const { data: savedArticles } = useQuery({
    queryFn: readSavedArticles,
    queryKey: SAVED_ARTICLES_QUERY_KEY,
  });
  const isCurrentArticleSaved = isArticleSaved(articleId, savedArticles);
  const simplifyMutation = useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error('article.errorDescription');
      }

      const targetPercent =
        selectedTargetLength === 'original'
          ? undefined
          : (Number(selectedTargetLength) as 10 | 25 | 50);

      return simplifyWikipediaArticle({
        articleId: article.id,
        blocks: createSimplificationRequestBlocks(
          stripDuplicateTitleHeading(article.blocks, article.title),
        ),
        level: selectedLevel,
        targetPercent,
        text: article.content,
        title: article.title,
      });
    },
    onError: (mutationError) => {
      console.error('[ArticleScreen] Failed to adapt article', mutationError);
      showBanner({
        title: t('article.adaptError'),
        variant: 'error',
      });
    },
    onSuccess: (response) => {
      setAdaptedArticle(response);
      setShowAdaptedText(true);
      setSelectedWord(null);
      void queryClient.invalidateQueries({ queryKey: ['wikipedia', 'articles'] });
    },
  });
  const dictionaryMutation = useMutation({
    mutationFn: createDictionaryWord,
    onError: () => {
      showBanner({
        title: t('dictionary.saveError'),
        variant: 'error',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words'] });
      showBanner({
        title: t('dictionary.saved'),
        variant: 'success',
      });
    },
  });
  const savedArticleMutation = useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error('article.errorDescription');
      }

      const savedArticle = createSavedArticleFromDetail(article);

      if (isCurrentArticleSaved) {
        const nextSavedArticles = await removeSavedArticle(article.id);

        return {
          saved: false,
          savedArticles: nextSavedArticles,
        };
      }

      const nextSavedArticles = await saveArticleForLater(savedArticle);

      return {
        saved: true,
        savedArticles: nextSavedArticles,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSavedArticles) {
        queryClient.setQueryData(
          SAVED_ARTICLES_QUERY_KEY,
          context.previousSavedArticles,
        );
      }

      showBanner({
        title: t('article.savedArticles.error'),
        variant: 'error',
      });
    },
    onMutate: async () => {
      if (!article) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: SAVED_ARTICLES_QUERY_KEY });

      const previousSavedArticles =
        queryClient.getQueryData<SavedArticle[]>(SAVED_ARTICLES_QUERY_KEY) ?? [];
      const nextSavedArticles = isCurrentArticleSaved
        ? previousSavedArticles.filter((savedArticle) => savedArticle.id !== article.id)
        : createSavedArticlesWithArticle(
            previousSavedArticles,
            createSavedArticleFromDetail(article),
          );

      queryClient.setQueryData(SAVED_ARTICLES_QUERY_KEY, nextSavedArticles);

      return { previousSavedArticles };
    },
    onSuccess: (response) => {
      queryClient.setQueryData(SAVED_ARTICLES_QUERY_KEY, response.savedArticles);
      showBanner({
        title: response.saved
          ? t('article.savedArticles.saved')
          : t('article.savedArticles.removed'),
        variant: 'success',
      });
    },
  });
  const quizMutation = useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error('article.errorDescription');
      }

      return generateArticleQuiz({
        level: selectedLevel,
        targetLength: 'medium',
        text: article.content,
        title: article.title,
      });
    },
    onError: () => {
      showBanner({
        title: t('article.quiz.error'),
        variant: 'error',
      });
    },
    onSuccess: (response) => {
      if (articleId === null) {
        return;
      }

      queryClient.setQueryData(
        getArticleQuizSessionKey(articleId, selectedLevel, 'medium'),
        response,
      );
      setIsQuizModePickerOpen(false);
      router.push({
        params: {
          id: String(articleId),
          level: selectedLevel,
          targetLength: 'medium',
        },
        pathname: '/article-quiz/[id]',
      });
    },
  });

  const levelOptions = useMemo(
    () => [
      { label: t('article.levels.A1'), value: 'A1' as const },
      { label: t('article.levels.A2'), value: 'A2' as const },
      { label: t('article.levels.B1'), value: 'B1' as const },
      { label: t('article.levels.B2'), value: 'B2' as const },
    ],
    [t],
  );

  const targetLengthOptions = useMemo(
    () => {
      return [
        {
          disabled: false,
          displayLabel: t('article.lengthsShort.original'),
          label: t('article.lengths.original'),
          value: 'original' as const,
        },
        {
          disabled: false,
          displayLabel: t('article.lengthsShort.percent10'),
          label: t('article.lengths.percent10'),
          value: '10' as const,
        },
        {
          disabled: false,
          displayLabel: t('article.lengthsShort.percent25'),
          label: t('article.lengths.percent25'),
          value: '25' as const,
        },
        {
          disabled: false,
          displayLabel: t('article.lengthsShort.percent50'),
          label: t('article.lengths.percent50'),
          value: '50' as const,
        },
      ];
    },
    [t],
  );

  const isSelectedTargetLengthDisabled = Boolean(
    targetLengthOptions.find((option) => option.value === selectedTargetLength)?.disabled,
  );

  const handleWordPress = useCallback((selection: SelectedWord) => {
    setSelectedWord(selection);
  }, []);

  const handleCloseTranslation = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleAddToDictionary = useCallback(() => {
    if (!selectedWord || !translation?.translation) {
      return;
    }

    dictionaryMutation.mutate({
      context: selectedWord.context,
      translation: translation.translation,
      word: selectedWord.word,
    });
  }, [dictionaryMutation, selectedWord, translation?.translation]);

  const handleOpenAdaptSettings = useCallback(() => {
    setIsAdaptSettingsOpen(true);
  }, []);

  const handleCloseAdaptSettings = useCallback(() => {
    setIsAdaptSettingsOpen(false);
  }, []);

  const handleOpenQuizModePicker = useCallback(() => {
    quizMutation.reset();
    setIsQuizModePickerOpen(true);
  }, [quizMutation]);

  const handleCloseQuizModePicker = useCallback(() => {
    if (quizMutation.isPending) {
      return;
    }

    setIsQuizModePickerOpen(false);
  }, [quizMutation.isPending]);

  const handleGenerateArticleQuiz = useCallback(() => {
    quizMutation.mutate();
  }, [quizMutation]);

  const handleAdaptFromModal = useCallback(() => {
    simplifyMutation.mutate();
    setIsAdaptSettingsOpen(false);
  }, [simplifyMutation]);

  const handleShowOriginalPress = useCallback(() => {
    setSelectedWord(null);
    setShowAdaptedText(false);
  }, []);

  const handleShowAdaptedPress = useCallback(() => {
    setSelectedWord(null);
    setShowAdaptedText(true);
  }, []);
  const handleToggleSavedArticle = useCallback(() => {
    if (savedArticleMutation.isPending) {
      return;
    }

    savedArticleMutation.mutate();
  }, [savedArticleMutation]);
  const renderSavedHeaderButton = useCallback(
    () => (
      <Pressable
        accessibilityLabel={
          isCurrentArticleSaved
            ? t('article.savedArticles.removeAction')
            : t('article.savedArticles.saveAction')
        }
        onPress={handleToggleSavedArticle}
        style={styles.headerIconButton}>
        <IconSymbol
          color={isCurrentArticleSaved ? savedAccentColor : iconColor}
          name={isCurrentArticleSaved ? 'bookmark.fill' : 'bookmark'}
          size={24}
        />
      </Pressable>
    ),
    [handleToggleSavedArticle, iconColor, isCurrentArticleSaved, savedAccentColor, t],
  );
  const displayedText = useMemo(() => {
    return article?.content ?? '';
  }, [article?.content]);
  const displayedBlocks = useMemo(() => {
    if (!article) {
      return undefined;
    }

    if (showAdaptedText) {
      return adaptedArticle?.adaptedBlocks;
    }

    return stripDuplicateTitleHeading(article.blocks, article.title);
  }, [adaptedArticle?.adaptedBlocks, article, showAdaptedText]);
  const shouldRenderHeroImage = useMemo(() => {
    if (!article?.thumbnailUrl || hasImageLoadError) {
      return false;
    }

    if (showAdaptedText) {
      return true;
    }

    return !hasDuplicateArticleImage(article.thumbnailUrl, displayedBlocks ?? article.blocks);
  }, [
    article?.blocks,
    article?.thumbnailUrl,
    displayedBlocks,
    hasImageLoadError,
    showAdaptedText,
  ]);

  useEffect(() => {
    setHasImageLoadError(false);
  }, [article?.thumbnailUrl]);

  useEffect(() => {
    if (!article) {
      return;
    }

    const recentArticle = createRecentArticleFromDetail(article);

    void recordRecentArticle(recentArticle).then((recentArticles) => {
      queryClient.setQueryData(RECENT_ARTICLES_QUERY_KEY, recentArticles);
    });
  }, [article, queryClient]);

  useEffect(() => {
    if (!isSelectedTargetLengthDisabled) {
      return;
    }

    const firstEnabledOption = targetLengthOptions.find((option) => !option.disabled);

    if (firstEnabledOption) {
      setSelectedTargetLength(firstEnabledOption.value);
    }
  }, [isSelectedTargetLengthDisabled, targetLengthOptions]);

  if (articleId === null) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('article.invalidId')}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('article.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !article) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('article.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('article.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  if (simplifyMutation.isPending) {
    return (
      <ScreenContainer>
        <Stack.Screen
          options={{
            headerRight: renderSavedHeaderButton,
            title: article.title,
          }}
        />
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('article.adapting')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: renderSavedHeaderButton,
          title: article.title,
        }}
      />
      <InteractiveArticleText
        blocks={displayedBlocks}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {shouldRenderHeroImage ? (
              <Image
                cachePolicy="disk"
                contentFit="cover"
                onError={() => setHasImageLoadError(true)}
                source={{ uri: article.thumbnailUrl }}
                style={styles.heroImage}
                transition={120}
              />
            ) : null}

            <View style={styles.header}>
              <ThemedText type="screenTitle">{article.title}</ThemedText>
              <Pressable onPress={() => Linking.openURL(article.url)}>
                <ThemedText type="bodyStrong" style={styles.wikipediaLink}>
                  {t('article.openOriginal')}
                </ThemedText>
              </Pressable>
            </View>

            {adaptedArticle ? (
              <View style={styles.articleMeta}>
                <ThemedText type="description" style={styles.infoText}>
                  {showAdaptedText
                    ? t('article.adaptedState', {
                        adaptedLength: adaptedArticle.adaptedLength,
                        level: adaptedArticle.level,
                        originalLength: adaptedArticle.originalLength,
                        targetLength: t(
                          `article.lengths.percent${adaptedArticle.targetPercent}`,
                        ),
                      })
                    : t('article.originalState', {
                        level: adaptedArticle.level,
                        originalLength: adaptedArticle.originalLength,
                        targetLength: t(
                          `article.lengths.percent${adaptedArticle.targetPercent}`,
                        ),
                      })}
                </ThemedText>
              </View>
            ) : null}
          </View>
        }
        onWordPress={handleWordPress}
        selectedTokenKey={selectedWord?.tokenKey}
        text={displayedText}
      />
      <WordTranslationSheet
        context={selectedWord?.context}
        error={Boolean(translationError)}
        isAddToDictionaryDisabled={
          isTranslationLoading ||
          Boolean(translationError) ||
          !translation?.translation ||
          dictionaryMutation.isPending
        }
        loading={isTranslationLoading}
        onAddToDictionary={handleAddToDictionary}
        onClose={handleCloseTranslation}
        open={selectedWord !== null}
        translation={translation?.translation}
        word={selectedWord?.word}
      />
      <ModalSheet
        contentStyle={styles.adaptModalContent}
        onClose={handleCloseAdaptSettings}
        open={isAdaptSettingsOpen}
        title={t('article.adaptText')}>
        {adaptedArticle ? (
          <SegmentedToggle
            onChange={(value) => {
              if (value === 'adapted') {
                handleShowAdaptedPress();
                return;
              }

              handleShowOriginalPress();
            }}
            options={[
              { label: t('article.textMode.adapted'), value: 'adapted' },
              { label: t('article.textMode.original'), value: 'original' },
            ]}
            selectedValue={showAdaptedText ? 'adapted' : 'original'}
          />
        ) : null}
        <View style={styles.adaptModalFields}>
          <View style={styles.adaptModalPickerField}>
            <OptionPickerField
              label={t('article.levelLabel')}
              onSelect={setSelectedLevel}
              options={levelOptions}
              selectedValue={selectedLevel}
              title={t('article.levelPickerTitle')}
            />
          </View>
          <View style={styles.adaptModalPickerField}>
            <OptionPickerField
              label={t('article.lengthLabel')}
              onSelect={setSelectedTargetLength}
              options={targetLengthOptions}
              selectedValue={selectedTargetLength}
              title={t('article.lengthPickerTitle')}
            />
          </View>
        </View>
        <Button
          disabled={simplifyMutation.isPending || isSelectedTargetLengthDisabled}
          onPress={handleAdaptFromModal}
          variant="primary">
          {simplifyMutation.isPending ? t('article.adapting') : t('article.adaptText')}
        </Button>
      </ModalSheet>
      <ModalSheet
        contentStyle={styles.adaptModalContent}
        onClose={handleCloseQuizModePicker}
        open={isQuizModePickerOpen}
        title={t('article.quiz.modeTitle')}>
        {quizMutation.isPending ? (
          <View style={styles.quizModalLoading}>
            <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
            <ThemedText type="body">{t('article.quiz.generating')}</ThemedText>
          </View>
        ) : (
          <View style={styles.quizModalActions}>
            <Button onPress={handleGenerateArticleQuiz} variant="primary">
              {t('article.quiz.articleKnowledge')}
            </Button>
            <Button onPress={() => undefined} variant="secondary">
              {t('article.quiz.vocabularyKnowledge')}
            </Button>
          </View>
        )}
      </ModalSheet>
      {!isAdaptSettingsOpen && !isQuizModePickerOpen ? (
        <Cta
          layout="vertical"
          primaryAction={{
            label: t('article.reinforceKnowledge'),
            onPress: handleOpenQuizModePicker,
          }}
          secondaryAction={{
            label: t('article.configureText'),
            onPress: handleOpenAdaptSettings,
            variant: 'secondary',
          }}
          withBackground
        />
      ) : null}
    </ScreenContainer>
  );
}

function stripDuplicateTitleHeading(
  blocks: ArticleBlock[],
  articleTitle: string,
): ArticleBlock[] {
  const normalizedTitle = articleTitle.trim().toLowerCase();
  const firstBlock = blocks[0];

  if (
    firstBlock?.type === 'heading' &&
    firstBlock.level === 1 &&
    firstBlock.text.trim().toLowerCase() === normalizedTitle
  ) {
    return blocks.slice(1);
  }

  return blocks;
}

function hasDuplicateArticleImage(
  thumbnailUrl: string,
  blocks: ArticleBlock[],
): boolean {
  const normalizedThumbnailIdentity = getWikipediaImageIdentity(thumbnailUrl);

  if (!normalizedThumbnailIdentity) {
    return false;
  }

  return blocks.some((block) => {
    return (
      block.type === 'image' &&
      getWikipediaImageIdentity(block.src) === normalizedThumbnailIdentity
    );
  });
}

function getWikipediaImageIdentity(imageUrl: string): string | null {
  try {
    const { pathname } = new URL(imageUrl);
    const pathSegments = pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return null;
    }

    const thumbIndex = pathSegments.findIndex((segment) => segment === 'thumb');
    const rawFileName =
      thumbIndex >= 0 && thumbIndex + 3 < pathSegments.length
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

    if (!rawFileName) {
      return null;
    }

    return decodeURIComponent(rawFileName)
      .replace(/^\d+px-/, '')
      .trim()
      .toLowerCase();
  } catch {
    return imageUrl.trim().toLowerCase() || null;
  }
}

function createSimplificationRequestBlocks(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'formula') {
      return block;
    }

    return {
      altText: block.altText,
      display: block.display,
      type: 'formula',
    };
  });
}

