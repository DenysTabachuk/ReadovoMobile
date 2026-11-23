import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type {
  CheckVocabularyAnswerResponse,
  VocabularyPracticeQuestion,
} from '@/api/generated/transport';
import { ThemedText } from '@/components/themedText';
import { AnswerFeedback } from '../AnswerFeedback';
import { SentenceWithGap } from './components/SentenceWithGap';
import { WordOption } from './components/wordOption';
import { styles } from './styles';

type SentenceGapExerciseProps = {
  question: VocabularyPracticeQuestion;
  answer: CheckVocabularyAnswerResponse | null;
  selectedOptionId: string | null;
  isSubmitting: boolean;
  onSelect: (optionId: string) => void;
};

export function SentenceGapExercise({
  question,
  answer,
  selectedOptionId,
  isSubmitting,
  onSelect,
}: SentenceGapExerciseProps) {
  const { t } = useTranslation();
  return (
    <>
      <ThemedText type="description">
        {t('vocabulary.sentence.chooseWord')}
      </ThemedText>
      <SentenceWithGap
        before={question.sentenceBefore}
        after={question.sentenceAfter}
        answerWord={answer?.word.word ?? null}
      />
      <View accessibilityRole="radiogroup" style={styles.options}>
        {question.options.map((option) => (
          <WordOption
            key={option.id}
            word={option.word.toLowerCase()}
            selected={selectedOptionId === option.id}
            checked={answer !== null}
            disabled={isSubmitting || answer !== null}
            correct={option.id === answer?.correctOptionId}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </View>
      {answer && (
        <AnswerFeedback answer={answer}>
          {answer.sentenceTranslationUk !== null && (
            <ThemedText>{answer.sentenceTranslationUk}</ThemedText>
          )}
        </AnswerFeedback>
      )}
    </>
  );
}
