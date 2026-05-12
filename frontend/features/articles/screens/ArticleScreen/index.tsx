import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { translateWord } from '@/api/translations';
import { createDictionaryWord } from '@/api/dictionary';
import {
  type ArticleAdaptationSummary,
  type ArticleBlock,
  type ArticleTextTransformationType,
  fetchArticleAdaptations,
  fetchWikipediaArticleDetail,
  generateArticleQuiz,
  generateArticleVocabularyQuiz,
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
  type ArticleQuizMode,
  type SavedArticle,
} from '@/features/articles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/authProvider';

import { InteractiveArticleText } from './components/interactiveArticleText';
import { WordTranslationSheet } from './components/wordTranslationSheet';
import { styles } from './styles';

type SelectedWord = {
  context: string;
  tokenKey: string;
  word: string;
};

const DEFAULT_SIMPLIFICATION_LEVEL: SimplifyArticleLevel = 'A2';
const TEXT_VIEW_MODES = ['original', 'adaptation', 'summary'] as const;
type ArticleTextViewMode = (typeof TEXT_VIEW_MODES)[number];

export default function ArticleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const savedAccentColor = colorScheme === 'dark' ? '#c4a7ff' : tintColor;
  const adaptationReadyBorderColor = useThemeColor(
    { dark: '#2b6f43', light: '#9dddb7' },
    'icon',
  );
  const adaptationReadyTextColor = useThemeColor(
    { dark: '#7ee0a0', light: '#1f8a4c' },
    'text',
  );
  const { showBanner } = useBanner();
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [generatedArticles, setGeneratedArticles] = useState<
    Partial<Record<ArticleTextTransformationType, SimplifyArticleResponse>>
  >({});
  const [selectedTextViewMode, setSelectedTextViewMode] =
    useState<ArticleTextViewMode>('original');
  const [latestGeneratedTransformationType, setLatestGeneratedTransformationType] =
    useState<ArticleTextTransformationType | null>(null);
  const [hasImageLoadError, setHasImageLoadError] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SimplifyArticleLevel>(
    DEFAULT_SIMPLIFICATION_LEVEL,
  );
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
  const { data: articleAdaptationsById = {} } = useQuery({
    enabled: articleId !== null,
    queryFn: async () => {
      if (articleId === null) {
        throw new Error('article.invalidId');
      }

      return fetchArticleAdaptations([articleId], 'all');
    },
    queryKey: ['wikipedia', 'article-adaptations', articleId],
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
    enabled: Boolean(currentUser?.id),
    queryFn: () => readSavedArticles(currentUser?.id ?? ''),
    queryKey: [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
  });
  const isCurrentArticleSaved = isArticleSaved(articleId, savedArticles);
  const simplifyMutation = useMutation({
    mutationFn: async (transformationType: ArticleTextTransformationType) => {
      if (!article) {
        throw new Error('article.errorDescription');
      }

      return simplifyWikipediaArticle({
        articleId: article.id,
        blocks: createSimplificationRequestBlocks(
          stripDuplicateTitleHeading(article.blocks, article.title),
        ),
        level: selectedLevel,
        text: article.content,
        title: article.title,
        transformationType,
      });
    },
    onError: (mutationError, transformationType) => {
      console.error('[ArticleScreen] Failed to adapt article', mutationError);
      showBanner({
        title:
          transformationType === 'adaptation'
            ? t('article.adaptError')
            : t('article.summaryError'),
        variant: 'error',
      });
    },
    onSuccess: (response) => {
      setGeneratedArticles((currentState) => ({
        ...currentState,
        [response.transformationType]: response,
      }));
      setSelectedTextViewMode(response.transformationType);
      setLatestGeneratedTransformationType(response.transformationType);
      setSelectedWord(null);
      void queryClient.invalidateQueries({
        queryKey: [...RECENT_ARTICLES_QUERY_KEY, currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['wikipedia', 'article-adaptations'],
      });
      void queryClient.invalidateQueries({ queryKey: ['wikipedia', 'articles'] });
    },
  });
  const dictionaryMutation = useMutation({
    mutationFn: ({
      context,
      translation,
      word,
    }: {
      context: string;
      translation: string;
      word: string;
    }) => createDictionaryWord(currentUser?.id ?? '', { context, translation, word }),
    onError: () => {
      showBanner({
        title: t('dictionary.saveError'),
        variant: 'error',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', currentUser?.id],
      });
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

      if (!currentUser?.id) {
        throw new Error('auth.required');
      }

      if (isCurrentArticleSaved) {
        const nextSavedArticles = await removeSavedArticle(
          currentUser.id,
          article.id,
        );

        return {
          saved: false,
          savedArticles: nextSavedArticles,
        };
      }

      const nextSavedArticles = await saveArticleForLater(
        currentUser.id,
        savedArticle,
      );

      return {
        saved: true,
        savedArticles: nextSavedArticles,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSavedArticles) {
        queryClient.setQueryData(
          [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
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

      await queryClient.cancelQueries({
        queryKey: [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
      });

      const previousSavedArticles =
        queryClient.getQueryData<SavedArticle[]>([
          ...SAVED_ARTICLES_QUERY_KEY,
          currentUser?.id,
        ]) ?? [];
      const nextSavedArticles = isCurrentArticleSaved
        ? previousSavedArticles.filter((savedArticle) => savedArticle.id !== article.id)
        : createSavedArticlesWithArticle(
            previousSavedArticles,
            createSavedArticleFromDetail(article),
          );

      queryClient.setQueryData(
        [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
        nextSavedArticles,
      );

      return { previousSavedArticles };
    },
    onSuccess: (response) => {
      queryClient.setQueryData(
        [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
        response.savedArticles,
      );
      showBanner({
        title: response.saved
          ? t('article.savedArticles.saved')
          : t('article.savedArticles.removed'),
        variant: 'success',
      });
    },
  });
  const quizMutation = useMutation({
    mutationFn: async (mode: ArticleQuizMode) => {
      if (!article) {
        throw new Error('article.errorDescription');
      }

      if (mode === 'vocabulary') {
        const response = await generateArticleVocabularyQuiz({
          level: selectedLevel,
          text: article.content,
          title: article.title,
        });

        return {
          mode,
          response,
          resolvedLevel: selectedLevel,
        };
      }

      const response = await generateArticleQuiz({
        level: selectedLevel,
        targetLength: 'medium',
        text: article.content,
        title: article.title,
      });

      return {
        mode,
        response,
        resolvedLevel: selectedLevel,
      };
    },
    onError: () => {
      showBanner({
        title: t('article.quiz.error'),
        variant: 'error',
      });
    },
    onSuccess: ({ mode, response, resolvedLevel }) => {
      if (articleId === null) {
        return;
      }

      queryClient.setQueryData(
        getArticleQuizSessionKey(articleId, mode, resolvedLevel, 'medium'),
        response,
      );
      setIsQuizModePickerOpen(false);
      router.push({
        params: {
          id: String(articleId),
          level: resolvedLevel,
          mode,
          targetLength: 'medium',
        },
        pathname: '/article-quiz/[id]',
      });
    },
  });

  const availableAdaptations = useMemo(() => {
    const persistedAdaptations =
      articleId === null ? [] : articleAdaptationsById[String(articleId)] ?? [];
    const currentAdaptations = Object.values(generatedArticles).map((generatedArticle) => ({
      level: generatedArticle.level,
      transformationType: generatedArticle.transformationType,
    }));
    const uniqueAdaptations = new Map<string, ArticleAdaptationSummary>();

    [...persistedAdaptations, ...currentAdaptations].forEach((adaptation) => {
      uniqueAdaptations.set(
        createAdaptationKey(
          adaptation.level,
          adaptation.transformationType,
        ),
        adaptation,
      );
    });

    return Array.from(uniqueAdaptations.values());
  }, [articleAdaptationsById, articleId, generatedArticles]);
  const isSelectedAdaptationAvailable = availableAdaptations.some((adaptation) =>
    isSameAdaptation(adaptation, selectedLevel, 'adaptation'),
  );
  const isSelectedSummaryAvailable = availableAdaptations.some((adaptation) =>
    isSameAdaptation(adaptation, selectedLevel, 'summary'),
  );
  const levelOptions = useMemo(
    () =>
      (['A1', 'A2', 'B1', 'B2'] as const).map((level) => {
        const hasAdaptation = availableAdaptations.some((adaptation) =>
          isSameAdaptation(adaptation, level, 'adaptation'),
        );
        const hasSummary = availableAdaptations.some((adaptation) =>
          isSameAdaptation(adaptation, level, 'summary'),
        );
        const statusIcons = [];

        if (hasAdaptation) {
          statusIcons.push({
            accessibilityLabel: t('article.levelOptionReadyAdaptation'),
            name: 'sparkles-outline' as const,
          });
        }

        if (hasSummary) {
          statusIcons.push({
            accessibilityLabel: t('article.levelOptionReadySummary'),
            name: 'document-text-outline' as const,
          });
        }

        return {
          label: t(`article.levels.${level}`),
          statusIcons: statusIcons.length > 0 ? statusIcons : undefined,
          value: level,
        };
      }),
    [availableAdaptations, t],
  );
  const generatedTextModeOptions = useMemo(() => {
    const options: Array<{
      label: string;
      value: ArticleTextViewMode;
    }> = [{ label: t('article.textMode.original'), value: 'original' }];

    if (generatedArticles.adaptation) {
      options.push({
        label: t('article.textMode.adapted'),
        value: 'adaptation',
      });
    }

    if (generatedArticles.summary) {
      options.push({
        label: t('article.textMode.summary'),
        value: 'summary',
      });
    }

    return options;
  }, [generatedArticles.adaptation, generatedArticles.summary, t]);
  const hasLoadedSelectedAdaptation =
    generatedArticles.adaptation?.level === selectedLevel;
  const hasLoadedSelectedSummary = generatedArticles.summary?.level === selectedLevel;

  const handleWordPress = useCallback((selection: SelectedWord) => {
    setSelectedWord(selection);
  }, []);

  const handleCloseTranslation = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleAddToDictionary = useCallback(() => {
    if (!currentUser?.id || !selectedWord || !translation?.translation) {
      return;
    }

    dictionaryMutation.mutate({
      context: selectedWord.context,
      translation: translation.translation,
      word: selectedWord.word,
    });
  }, [currentUser?.id, dictionaryMutation, selectedWord, translation?.translation]);

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
    quizMutation.mutate('article');
  }, [quizMutation]);

  const handleGenerateVocabularyQuiz = useCallback(() => {
    quizMutation.mutate('vocabulary');
  }, [quizMutation]);

  const handleAdaptFromModal = useCallback(() => {
    simplifyMutation.mutate('adaptation');
    setIsAdaptSettingsOpen(false);
  }, [simplifyMutation]);
  const handleSummarizeFromModal = useCallback(() => {
    simplifyMutation.mutate('summary');
    setIsAdaptSettingsOpen(false);
  }, [simplifyMutation]);
  const handleShowAdaptedFromModal = useCallback(() => {
    setSelectedWord(null);

    if (hasLoadedSelectedAdaptation) {
      setSelectedTextViewMode('adaptation');
      setIsAdaptSettingsOpen(false);
      return;
    }

    if (isSelectedAdaptationAvailable) {
      simplifyMutation.mutate('adaptation');
    }

    setIsAdaptSettingsOpen(false);
  }, [
    hasLoadedSelectedAdaptation,
    isSelectedAdaptationAvailable,
    simplifyMutation,
  ]);
  const handleShowSummaryFromModal = useCallback(() => {
    setSelectedWord(null);

    if (hasLoadedSelectedSummary) {
      setSelectedTextViewMode('summary');
      setIsAdaptSettingsOpen(false);
      return;
    }

    if (isSelectedSummaryAvailable) {
      simplifyMutation.mutate('summary');
    }

    setIsAdaptSettingsOpen(false);
  }, [hasLoadedSelectedSummary, isSelectedSummaryAvailable, simplifyMutation]);

  const handleShowOriginalPress = useCallback(() => {
    setSelectedWord(null);
    setSelectedTextViewMode('original');
  }, []);

  const handleShowAdaptedPress = useCallback(() => {
    setSelectedWord(null);
    setSelectedTextViewMode('adaptation');
  }, []);
  const handleShowSummaryPress = useCallback(() => {
    setSelectedWord(null);
    setSelectedTextViewMode('summary');
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
  const displayedGeneratedArticle = useMemo(() => {
    if (selectedTextViewMode === 'original') {
      return null;
    }

    return generatedArticles[selectedTextViewMode] ?? null;
  }, [generatedArticles, selectedTextViewMode]);
  const displayedBlocks = useMemo(() => {
    if (!article) {
      return undefined;
    }

    if (displayedGeneratedArticle) {
      return displayedGeneratedArticle.adaptedBlocks;
    }

    return stripDuplicateTitleHeading(article.blocks, article.title);
  }, [article, displayedGeneratedArticle]);
  const shouldRenderHeroImage = useMemo(() => {
    if (!article?.thumbnailUrl || hasImageLoadError) {
      return false;
    }

    if (displayedGeneratedArticle) {
      return true;
    }

    return !hasDuplicateArticleImage(article.thumbnailUrl, displayedBlocks ?? article.blocks);
  }, [
    article?.blocks,
    article?.thumbnailUrl,
    displayedBlocks,
    displayedGeneratedArticle,
    hasImageLoadError,
  ]);
  const currentPendingTransformationType = simplifyMutation.variables;

  useEffect(() => {
    setHasImageLoadError(false);
  }, [article?.thumbnailUrl]);

  useEffect(() => {
    if (!article || !currentUser?.id) {
      return;
    }

    const recentArticle = createRecentArticleFromDetail(article);

    void recordRecentArticle(currentUser.id, recentArticle).then((recentArticles) => {
      queryClient.setQueryData(
        [...RECENT_ARTICLES_QUERY_KEY, currentUser.id],
        recentArticles,
      );
    });
  }, [article, currentUser?.id, queryClient]);

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
          <ThemedText type="body">
            {currentPendingTransformationType === 'adaptation'
              ? t('article.adapting')
              : t('article.summarizing')}
          </ThemedText>
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

            {latestGeneratedTransformationType ? (
              <View style={styles.articleMeta}>
                <ThemedText type="description" style={styles.infoText}>
                  {selectedTextViewMode === 'adaptation' && generatedArticles.adaptation
                    ? t('article.adaptedState', {
                        adaptedLength: generatedArticles.adaptation.adaptedLength,
                        level: generatedArticles.adaptation.level,
                        originalLength: generatedArticles.adaptation.originalLength,
                      })
                    : selectedTextViewMode === 'summary' && generatedArticles.summary
                      ? t('article.summarizedState', {
                          adaptedLength: generatedArticles.summary.adaptedLength,
                          level: generatedArticles.summary.level,
                          originalLength: generatedArticles.summary.originalLength,
                        })
                      : latestGeneratedTransformationType === 'adaptation' &&
                          generatedArticles.adaptation
                        ? t('article.originalStateWithAdaptation', {
                            level: generatedArticles.adaptation.level,
                          })
                        : latestGeneratedTransformationType === 'summary' &&
                            generatedArticles.summary
                          ? t('article.originalStateWithSummary', {
                              level: generatedArticles.summary.level,
                            })
                          : null}
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
        title={t('article.configureText')}>
        {generatedTextModeOptions.length > 1 ? (
          <SegmentedToggle
            onChange={(value) => {
              if (value === 'adaptation') {
                handleShowAdaptedPress();
                return;
              }

              if (value === 'summary') {
                handleShowSummaryPress();
                return;
              }

              handleShowOriginalPress();
            }}
            options={generatedTextModeOptions}
            selectedValue={selectedTextViewMode}
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
        </View>
        {isSelectedAdaptationAvailable || isSelectedSummaryAvailable ? (
          <View
            style={[
              styles.readyStatusList,
              { borderColor: adaptationReadyBorderColor },
            ]}>
            {isSelectedAdaptationAvailable ? (
              <View style={styles.readyStatusItem}>
                <Ionicons
                  color={adaptationReadyTextColor}
                  name="sparkles-outline"
                  size={16}
                />
                <ThemedText
                  type="description"
                  style={{ color: adaptationReadyTextColor }}>
                  {t('article.readyAdaptedShort')}
                </ThemedText>
              </View>
            ) : null}
            {isSelectedSummaryAvailable ? (
              <View style={styles.readyStatusItem}>
                <Ionicons
                  color={adaptationReadyTextColor}
                  name="document-text-outline"
                  size={16}
                />
                <ThemedText
                  type="description"
                  style={{ color: adaptationReadyTextColor }}>
                  {t('article.readySummaryShort')}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.textActionButtons}>
          {isSelectedAdaptationAvailable ? (
            <Button
              disabled={simplifyMutation.isPending}
              onPress={handleShowAdaptedFromModal}
              variant="primary">
              {t('article.showAdaptedText')}
            </Button>
          ) : null}
          {!isSelectedAdaptationAvailable ? (
            <Button
              disabled={simplifyMutation.isPending}
              onPress={handleAdaptFromModal}
              variant={isSelectedSummaryAvailable ? 'secondary' : 'primary'}>
              {simplifyMutation.isPending &&
              currentPendingTransformationType === 'adaptation'
                ? t('article.adapting')
                : t('article.adaptText')}
            </Button>
          ) : null}
          {isSelectedSummaryAvailable ? (
            <Button
              disabled={simplifyMutation.isPending}
              onPress={handleShowSummaryFromModal}
              variant={isSelectedAdaptationAvailable ? 'secondary' : 'primary'}>
              {t('article.showSummarizedText')}
            </Button>
          ) : null}
          {!isSelectedSummaryAvailable ? (
            <Button
              disabled={simplifyMutation.isPending}
              onPress={handleSummarizeFromModal}
              variant="secondary">
              {simplifyMutation.isPending &&
              currentPendingTransformationType === 'summary'
                ? t('article.summarizing')
                : t('article.summarizeText')}
            </Button>
          ) : null}
        </View>
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
            <Button onPress={handleGenerateVocabularyQuiz} variant="secondary">
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

function createAdaptationKey(
  level: SimplifyArticleLevel,
  transformationType: ArticleTextTransformationType,
): string {
  return `${transformationType}:${level}`;
}

function isSameAdaptation(
  adaptation: ArticleAdaptationSummary,
  level: SimplifyArticleLevel,
  transformationType: ArticleTextTransformationType,
): boolean {
  return (
    adaptation.level === level &&
    adaptation.transformationType === transformationType
  );
}

