import { TranslationSelectionProgress } from './components/translationSelectionProgress';
import { Cta } from '@/components/cta';
import { IconSymbol } from '@/components/iconSymbol';
import { ScreenContainer } from '@/components/screenContainer';
import { ScrollToTopButton } from '@/components/scrollToTopButton';
import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/theme';
import type { WikipediaArticleDetail } from '@/features/articles/api';
import { useAuth } from '@/features/auth';
import { WordTranslationSheet } from '@/features/translations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SCROLL_TO_TOP_THRESHOLD } from '../../constants';
import { useArticleLibrary } from '../../hooks/useArticleLibrary';
import { useArticleQuiz } from '../../hooks/useArticleQuiz';
import { useArticleReaderScroll } from '../../hooks/useArticleReaderScroll';
import { useArticleTransformations } from '../../hooks/useArticleTransformations';
import { useArticleTranslation } from '../../hooks/useArticleTranslation';
import { useArticleSpeech } from '../../useArticleSpeech';
import { ArticleQuizPicker } from './components/articleQuizPicker';
import { ArticleReaderHeader } from './components/articleReaderHeader';
import { ArticleTextSettings } from './components/articleTextSettings';
import { FloatingSpeechControls } from './components/floatingSpeechControls';
import { InteractiveArticleText } from './components/interactiveArticleText';
import { styles } from './styles';
type Props = { article: WikipediaArticleDetail };

const ARTICLE_CTA_NAVIGATION_OFFSET = 160;
const CURRENT_SPEECH_BUTTON_SPACING = 64;

export function ArticleReader({ article }: Props) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const savedAccentColor = colorScheme === 'dark' ? '#c4a7ff' : tintColor;
  const translationController = useArticleTranslation();
  const {
    selectedTokens,
    selectedTokenKeys,
    selectedFragment,
    translation,
    translationError,
    isTranslationLoading,
    dictionaryMutation,
    isTranslationSheetOpen,
    handleWordPress,
    handleCloseTranslation,
    handleAddToDictionary,
  } = translationController;
  const [isAdaptSettingsOpen, setIsAdaptSettingsOpen] = useState(false);
  const transformations = useArticleTransformations(
    article,
    handleCloseTranslation,
  );
  const {
    selectedLevel,
    displayedBlocks,
    displayedGeneratedArticle,
    latestGeneratedArticle,
    isGenerating,
    pendingTransformationType,
  } = transformations;
  const quiz = useArticleQuiz(article, selectedLevel);
  const { isQuizModePickerOpen, handleOpenQuizModePicker } = quiz;
  const { isCurrentArticleSaved, handleToggleSavedArticle, isSaving } =
    useArticleLibrary(article);
  const articleSpeech = useArticleSpeech(displayedBlocks);
  const {
    articleListRef,
    scrollToSourceIndexRef,
    scrollToTopOffsetY,
    isScrolledPastSpeechControls,
    shouldShowCurrentSpeechButton,
    currentSpeechButtonIconName,
    handleArticleScroll,
    handleSpeechControlsLayout,
    handleVisibleBlockIndexesChange,
    handleScrollToCurrentSpeechWord,
  } = useArticleReaderScroll(articleSpeech);
  const shouldShowArticleCta =
    articleSpeech.status === 'idle' &&
    !isAdaptSettingsOpen &&
    !isQuizModePickerOpen;
  const navigationButtonBottomOffset = shouldShowArticleCta
    ? ARTICLE_CTA_NAVIGATION_OFFSET
    : Spacing.xLg;
  const renderSavedHeaderButton = useCallback(
    () => (
      <Pressable
        accessibilityLabel={
          isCurrentArticleSaved
            ? t('article.savedArticles.removeAction')
            : t('article.savedArticles.saveAction')
        }
        disabled={isSaving}
        onPress={handleToggleSavedArticle}
        style={styles.headerIconButton}
      >
        <IconSymbol
          color={isCurrentArticleSaved ? savedAccentColor : iconColor}
          name={isCurrentArticleSaved ? 'bookmark.fill' : 'bookmark'}
          size={24}
        />
      </Pressable>
    ),
    [
      isSaving,
      handleToggleSavedArticle,
      iconColor,
      isCurrentArticleSaved,
      savedAccentColor,
      t,
    ],
  );
  if (isGenerating) {
    return (
      <ScreenContainer>
        <Stack.Screen
          options={{
            headerRight: renderSavedHeaderButton,
            title: article.title,
          }}
        />
        <View style={styles.centerState}>
          <ActivityIndicator
            color={Colors[colorScheme ?? 'light'].tint}
            size="large"
          />
          <ThemedText type="body">
            {pendingTransformationType === 'adaptation'
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
        <TranslationSelectionProgress
          selectionKey={selectedTokenKeys.join('|')}
        />
      ) : null}
      <InteractiveArticleText
        blocks={displayedBlocks}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <ArticleReaderHeader
            article={article}
            displayedBlocks={displayedBlocks}
            articleSpeech={articleSpeech}
            transformation={{
              displayedArticle: displayedGeneratedArticle,
              latestGeneratedArticle,
              selectedLevel,
            }}
            handleSpeechControlsLayout={handleSpeechControlsLayout}
          />
        }
        onScroll={handleArticleScroll}
        onVisibleBlockIndexesChange={handleVisibleBlockIndexesChange}
        onWordPress={handleWordPress}
        scrollRef={articleListRef}
        scrollToSourceIndexRef={scrollToSourceIndexRef}
        selectedTokenKeys={selectedTokenKeys}
        speakingTokenKey={articleSpeech.activeTokenKey}
        text={article.content}
      />
      <FloatingSpeechControls
        articleSpeech={articleSpeech}
        visible={
          articleSpeech.status !== 'idle' && isScrolledPastSpeechControls
        }
      />
      <ScrollToTopButton
        bottomOffset={navigationButtonBottomOffset}
        rightOffset={Spacing.md}
        scrollOffsetY={scrollToTopOffsetY}
        threshold={SCROLL_TO_TOP_THRESHOLD}
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
            {
              bottom:
                navigationButtonBottomOffset + CURRENT_SPEECH_BUTTON_SPACING,
            },
          ]}
        >
          <Ionicons
            color="#11181C"
            name={currentSpeechButtonIconName}
            size={24}
          />
        </Pressable>
      ) : null}
      <WordTranslationSheet
        baseTranslation={translation?.baseTranslation}
        context={selectedFragment?.context}
        contextTranslation={translation?.contextTranslation}
        contextualTranslation={translation?.contextualTranslation}
        error={translationError}
        isAddToDictionaryDisabled={
          isTranslationLoading ||
          Boolean(translationError) ||
          !translation?.translation ||
          selectedTokens.length === 0 ||
          !currentUser?.id ||
          dictionaryMutation.isPending
        }
        loading={isTranslationLoading}
        onAddToDictionary={handleAddToDictionary}
        onClose={handleCloseTranslation}
        open={isTranslationSheetOpen && selectedTokens.length > 0}
        translation={translation?.translation}
        word={selectedFragment?.text}
      />
      <ArticleTextSettings
        transformations={transformations}
        open={isAdaptSettingsOpen}
        onClose={() => setIsAdaptSettingsOpen(false)}
      />
      <ArticleQuizPicker controller={quiz} />
      {shouldShowArticleCta ? (
        <Cta
          layout="vertical"
          primaryAction={{
            label: t('article.reinforceKnowledge'),
            onPress: handleOpenQuizModePicker,
          }}
          secondaryAction={{
            label: t('article.configureText'),
            onPress: () => setIsAdaptSettingsOpen(true),
            variant: 'secondary',
          }}
          withBackground
        />
      ) : null}
    </ScreenContainer>
  );
}
