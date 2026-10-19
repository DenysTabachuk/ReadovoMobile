import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import type { useArticleQuiz } from '../../../../hooks/useArticleQuiz';
import { styles } from './styles';

type Props = { controller: ReturnType<typeof useArticleQuiz> };

export function ArticleQuizPicker({ controller }: Props) {
  const { t } = useTranslation();
  const tintColor = useThemeColor({}, 'tint');
  const {
    quizMutation,
    isQuizModePickerOpen,
    handleCloseQuizModePicker,
    handleGenerateArticleQuiz,
    handleGenerateVocabularyQuiz,
  } = controller;
  return (
    <ModalSheet
      contentStyle={styles.adaptModalContent}
      onClose={handleCloseQuizModePicker}
      open={isQuizModePickerOpen}
      title={t('article.quiz.modeTitle')}
    >
      {quizMutation.isPending ? (
        <View style={styles.quizModalLoading}>
          <ActivityIndicator color={tintColor} size="large" />
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
  );
}
