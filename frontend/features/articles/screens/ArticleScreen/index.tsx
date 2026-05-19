import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
import { ScrollToTopButton } from '@/components/scrollToTopButton';
import { SegmentedToggle } from '@/components/segmentedToggle';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/iconSymbol';
import { Spacing } from '@/constants/spacing';
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
import { WordTranslationSheet } from '@/features/translations/components/wordTranslationSheet';
import { useWordTranslation } from '@/features/translations/hooks/useWordTranslation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/authProvider';

import { ArticleSpeechControls } from './components/articleSpeechControls';
import { InteractiveArticleText } from './components/interactiveArticleText';
import { styles } from './styles';
import { useArticleSpeech } from './useArticleSpeech';

type SelectedTextToken = {
  context: string;
  sentenceKey?: string;
  sentenceWordIndex?: number;
  text: string;
  tokenKey: string;
  word: string;
};
type SelectedTextFragment = {
  context: string;
  text: string;
  tokenKeys: string[];
  words: string[];
};

const DEFAULT_SIMPLIFICATION_LEVEL: SimplifyArticleLevel = 'A2';
const TRANSLATION_SHEET_OPEN_DELAY_MS = 1000;
const FLOATING_SPEECH_CONTROLS_HIDDEN_OFFSET = -120;
const FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS = 220;
const TEXT_VIEW_MODES = ['original', 'adaptation', 'summary'] as const;
type ArticleTextViewMode = (typeof TEXT_VIEW_MODES)[number];
const TEXT_MODE_LABEL_KEYS: Record<ArticleTextViewMode, 'original' | 'adapted' | 'summary'> = {
  adaptation: 'adapted',
  original: 'original',
  summary: 'summary',
};

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
  const [selectedTokens, setSelectedTokens] = useState<SelectedTextToken[]>([]);
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
  const [isTranslationSheetOpen, setIsTranslationSheetOpen] = useState(false);
  const [translationSheetOpenProgress, setTranslationSheetOpenProgress] = useState(0);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const [speechControlsBottomY, setSpeechControlsBottomY] = useState<number | null>(
    null,
  );
  const [firstVisibleBlockIndex, setFirstVisibleBlockIndex] = useState(0);
  const [isFloatingSpeechControlsRendered, setIsFloatingSpeechControlsRendered] =
    useState(false);
  const articleListRef = useRef<FlatList>(null);
  const floatingSpeechControlsOpacity = useRef(new Animated.Value(0)).current;
  const floatingSpeechControlsTranslateY = useRef(
    new Animated.Value(FLOATING_SPEECH_CONTROLS_HIDDEN_OFFSET),
  ).current;
  const currentSpeechButtonRotation = useRef(new Animated.Value(0)).current;
  const selectedFragment = useMemo(
    () => buildSelectedFragment(selectedTokens),
    [selectedTokens],
  );

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
  } = useWordTranslation({
    context: selectedFragment?.context,
    enabled: selectedTokens.length > 0,
    queryScope: 'article-screen',
    word: selectedFragment?.text,
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
      setSelectedTokens([]);
      setIsTranslationSheetOpen(false);
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
    }> = [{ label: t('article.textModeShort.original'), value: 'original' }];

    if (generatedArticles.adaptation || isSelectedAdaptationAvailable) {
      options.push({
        label: t('article.textModeShort.adapted'),
        value: 'adaptation',
      });
    }

    if (generatedArticles.summary || isSelectedSummaryAvailable) {
      options.push({
        label: t('article.textModeShort.summary'),
        value: 'summary',
      });
    }

    return options;
  }, [
    generatedArticles.adaptation,
    generatedArticles.summary,
    isSelectedAdaptationAvailable,
    isSelectedSummaryAvailable,
    t,
  ]);
  const handleWordPress = useCallback((selection: SelectedTextToken) => {
    setSelectedTokens((currentSelection) => {
      const isTappedTokenAlreadySelected = currentSelection.some(
        (token) => token.tokenKey === selection.tokenKey,
      );

      if (isTappedTokenAlreadySelected) {
        setIsTranslationSheetOpen(true);
        return currentSelection;
      }

      setIsTranslationSheetOpen(false);
      return resolveNextTokenSelection(currentSelection, selection);
    });
  }, []);

  useEffect(() => {
    if (selectedTokens.length === 0 || isTranslationSheetOpen) {
      setTranslationSheetOpenProgress(0);
      return;
    }

    const startedAt = Date.now();
    const timeoutId = setTimeout(() => {
      setTranslationSheetOpenProgress(1);
      setIsTranslationSheetOpen(true);
    }, TRANSLATION_SHEET_OPEN_DELAY_MS);
    const intervalId = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextProgress = Math.min(1, elapsedMs / TRANSLATION_SHEET_OPEN_DELAY_MS);

      setTranslationSheetOpenProgress(nextProgress);
    }, 16);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isTranslationSheetOpen, selectedTokens]);

  const handleCloseTranslation = useCallback(() => {
    setSelectedTokens([]);
    setIsTranslationSheetOpen(false);
  }, []);

  const handleAddToDictionary = useCallback(() => {
    if (!currentUser?.id || !selectedFragment || !translation?.translation) {
      return;
    }

    dictionaryMutation.mutate({
      context: selectedFragment.context,
      translation: translation.translation,
      word: selectedFragment.text,
    });
  }, [currentUser?.id, dictionaryMutation, selectedFragment, translation?.translation]);

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

  const handleShowOriginalPress = useCallback(() => {
    setSelectedTokens([]);
    setIsTranslationSheetOpen(false);
    setSelectedTextViewMode('original');
  }, []);

  const handleShowAdaptedPress = useCallback(() => {
    setSelectedTokens([]);
    setIsTranslationSheetOpen(false);

    if (generatedArticles.adaptation?.level === selectedLevel || generatedArticles.adaptation) {
      setSelectedTextViewMode('adaptation');
      return;
    }

    if (isSelectedAdaptationAvailable) {
      simplifyMutation.mutate('adaptation');
    }
  }, [
    generatedArticles.adaptation,
    isSelectedAdaptationAvailable,
    selectedLevel,
    simplifyMutation,
  ]);
  const handleShowSummaryPress = useCallback(() => {
    setSelectedTokens([]);
    setIsTranslationSheetOpen(false);

    if (generatedArticles.summary?.level === selectedLevel || generatedArticles.summary) {
      setSelectedTextViewMode('summary');
      return;
    }

    if (isSelectedSummaryAvailable) {
      simplifyMutation.mutate('summary');
    }
  }, [
    generatedArticles.summary,
    isSelectedSummaryAvailable,
    selectedLevel,
    simplifyMutation,
  ]);
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
  const articleSpeech = useArticleSpeech(displayedBlocks);
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
  const shouldShowFloatingSpeechControls =
    articleSpeech.status !== 'idle' &&
    speechControlsBottomY !== null &&
    scrollOffsetY > speechControlsBottomY + Spacing.sm;
  const currentSpeechBlockIndex = useMemo(
    () => getBlockIndexFromTokenKey(articleSpeech.activeTokenKey),
    [articleSpeech.activeTokenKey],
  );
  const shouldShowCurrentSpeechButton =
    articleSpeech.status !== 'idle' && Boolean(articleSpeech.activeTokenKey);
  const shouldShowArticleCta =
    articleSpeech.status === 'idle' && !isAdaptSettingsOpen && !isQuizModePickerOpen;
  const navigationButtonBottomOffset = shouldShowArticleCta ? 160 : Spacing.xLg;
  const currentSpeechButtonBottomOffset =
    navigationButtonBottomOffset + 64;
  const currentSpeechButtonDirection =
    currentSpeechBlockIndex !== null && currentSpeechBlockIndex < firstVisibleBlockIndex
      ? 'up'
      : 'down';
  const currentSpeechButtonIconStyle = {
    transform: [
      {
        rotate: currentSpeechButtonRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const handleScrollToCurrentSpeechWord = useCallback(() => {
    if (currentSpeechBlockIndex === null) {
      return;
    }

    articleListRef.current?.scrollToIndex({
      animated: true,
      index: currentSpeechBlockIndex,
      viewPosition: 0.36,
    });
  }, [currentSpeechBlockIndex]);

  useEffect(() => {
    setHasImageLoadError(false);
  }, [article?.thumbnailUrl]);

  useEffect(() => {
    if (shouldShowFloatingSpeechControls) {
      setIsFloatingSpeechControlsRendered(true);
      floatingSpeechControlsOpacity.stopAnimation();
      floatingSpeechControlsTranslateY.stopAnimation();
      Animated.parallel([
        Animated.timing(floatingSpeechControlsOpacity, {
          duration: FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(floatingSpeechControlsTranslateY, {
          damping: 18,
          mass: 0.8,
          stiffness: 180,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    floatingSpeechControlsOpacity.stopAnimation();
    floatingSpeechControlsTranslateY.stopAnimation();
    Animated.parallel([
      Animated.timing(floatingSpeechControlsOpacity, {
        duration: FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(floatingSpeechControlsTranslateY, {
        duration: FLOATING_SPEECH_CONTROLS_ANIMATION_DURATION_MS,
        toValue: FLOATING_SPEECH_CONTROLS_HIDDEN_OFFSET,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsFloatingSpeechControlsRendered(false);
      }
    });
  }, [
    floatingSpeechControlsOpacity,
    floatingSpeechControlsTranslateY,
    shouldShowFloatingSpeechControls,
  ]);

  useEffect(() => {
    Animated.timing(currentSpeechButtonRotation, {
      duration: 180,
      toValue: currentSpeechButtonDirection === 'up' ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [currentSpeechButtonDirection, currentSpeechButtonRotation]);

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
      {selectedTokens.length > 0 && !isTranslationSheetOpen ? (
        <View style={styles.translationProgressTrack}>
          <View
            style={[
              styles.translationProgressFill,
              {
                backgroundColor: tintColor,
                width: `${Math.round(translationSheetOpenProgress * 100)}%`,
              },
            ]}
          />
        </View>
      ) : null}
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

            <ArticleSpeechControls
              disabled={!articleSpeech.canSpeak}
              onLayout={(event) => {
                const { height, y } = event.nativeEvent.layout;

                setSpeechControlsBottomY(y + height);
              }}
              onRestart={articleSpeech.restart}
              onStop={() => {
                void articleSpeech.stop();
              }}
              onTogglePlayPause={articleSpeech.togglePlayPause}
              progress={articleSpeech.progress}
              status={articleSpeech.status}
            />
          </View>
        }
        onScroll={(event) => {
          setScrollOffsetY(event.nativeEvent.contentOffset.y);
        }}
        onVisibleBlockIndexChange={setFirstVisibleBlockIndex}
        onWordPress={handleWordPress}
        scrollRef={articleListRef}
        selectedTokenKeys={selectedTokens.map((token) => token.tokenKey)}
        speakingTokenKey={articleSpeech.activeTokenKey}
        text={displayedText}
      />
      {isFloatingSpeechControlsRendered ? (
        <Animated.View
          style={[
            styles.floatingSpeechControls,
            { backgroundColor: Colors[colorScheme ?? 'light'].background },
            {
              opacity: floatingSpeechControlsOpacity,
              transform: [{ translateY: floatingSpeechControlsTranslateY }],
            },
          ]}>
          <ArticleSpeechControls
            disabled={!articleSpeech.canSpeak}
            onRestart={articleSpeech.restart}
            onStop={() => {
              void articleSpeech.stop();
            }}
            onTogglePlayPause={articleSpeech.togglePlayPause}
            progress={articleSpeech.progress}
            status={articleSpeech.status}
            style={styles.floatingSpeechControlsInner}
          />
        </Animated.View>
      ) : null}
      <ScrollToTopButton
        bottomOffset={navigationButtonBottomOffset}
        rightOffset={Spacing.md}
        scrollOffsetY={scrollOffsetY}
        scrollRef={articleListRef}
      />
      {shouldShowCurrentSpeechButton ? (
        <Pressable
          accessibilityLabel={t('article.speech.scrollToCurrentAction')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleScrollToCurrentSpeechWord}
          style={[
            styles.scrollToCurrentSpeechButton,
            { bottom: currentSpeechButtonBottomOffset },
          ]}>
          <Animated.View style={currentSpeechButtonIconStyle}>
            <Ionicons color="#11181C" name="arrow-down" size={24} />
          </Animated.View>
        </Pressable>
      ) : null}
      <WordTranslationSheet
        baseTranslation={translation?.baseTranslation}
        context={selectedFragment?.context}
        contextTranslation={translation?.contextTranslation}
        contextualTranslation={translation?.contextualTranslation}
        error={Boolean(translationError)}
        isAddToDictionaryDisabled={
          isTranslationLoading ||
          Boolean(translationError) ||
          !translation?.translation ||
          selectedTokens.length === 0 ||
          dictionaryMutation.isPending
        }
        loading={isTranslationLoading}
        onAddToDictionary={handleAddToDictionary}
        onClose={handleCloseTranslation}
        open={isTranslationSheetOpen && selectedTokens.length > 0}
        translation={translation?.translation}
        word={selectedFragment?.text}
      />
      <ModalSheet
        contentStyle={styles.adaptModalContent}
        onClose={handleCloseAdaptSettings}
        open={isAdaptSettingsOpen}
        title={t('article.configureText')}>
        {generatedTextModeOptions.length > 1 ? (
          <View style={styles.textModeSection}>
            <ThemedText type="description" style={styles.textModeCaption}>
              {t(`article.textMode.${TEXT_MODE_LABEL_KEYS[selectedTextViewMode]}`)}
            </ThemedText>
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
          </View>
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
      {shouldShowArticleCta ? (
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

function getBlockIndexFromTokenKey(tokenKey: string | undefined): number | null {
  const match = tokenKey?.match(/^block-(\d+)(?:-|$)/);
  const blockIndex = match?.[1] ? Number(match[1]) : NaN;

  if (!Number.isFinite(blockIndex)) {
    return null;
  }

  return blockIndex;
}

function buildSelectedFragment(
  selectedTokens: SelectedTextToken[],
): SelectedTextFragment | null {
  if (selectedTokens.length === 0) {
    return null;
  }

  const sortedTokens = [...selectedTokens].sort((leftToken, rightToken) => {
    return (leftToken.sentenceWordIndex ?? 0) - (rightToken.sentenceWordIndex ?? 0);
  });

  const context = sortedTokens[0]?.context?.trim() ?? '';
  const words = sortedTokens.map((token) => token.word);
  const text = sortedTokens.map((token) => token.text).join(' ').trim();

  if (!text || !context) {
    return null;
  }

  return {
    context,
    text,
    tokenKeys: sortedTokens.map((token) => token.tokenKey),
    words,
  };
}

function resolveNextTokenSelection(
  currentSelection: SelectedTextToken[],
  nextToken: SelectedTextToken,
): SelectedTextToken[] {
  if (currentSelection.length === 0) {
    return [nextToken];
  }

  const firstSelectedToken = currentSelection[0];
  const sameSentence = Boolean(
    firstSelectedToken?.sentenceKey &&
      nextToken.sentenceKey &&
      firstSelectedToken.sentenceKey === nextToken.sentenceKey,
  );
  const nextTokenAlreadySelected = currentSelection.some(
    (token) => token.tokenKey === nextToken.tokenKey,
  );

  if (!sameSentence) {
    return [nextToken];
  }

  if (nextTokenAlreadySelected) {
    return currentSelection;
  }

  const selectedIndexes = currentSelection
    .map((token) => token.sentenceWordIndex)
    .filter((index): index is number => typeof index === 'number');
  const nextTokenIndex = nextToken.sentenceWordIndex;

  if (selectedIndexes.length === 0 || typeof nextTokenIndex !== 'number') {
    return [nextToken];
  }

  const minIndex = Math.min(...selectedIndexes);
  const maxIndex = Math.max(...selectedIndexes);
  const isAdjacent = nextTokenIndex === minIndex - 1 || nextTokenIndex === maxIndex + 1;

  if (!isAdjacent) {
    return [nextToken];
  }

  if (currentSelection.length >= 5) {
    return currentSelection;
  }

  return [...currentSelection, nextToken];
}

