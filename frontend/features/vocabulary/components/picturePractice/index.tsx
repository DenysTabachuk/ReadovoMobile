import { useMemo } from 'react';
import { View } from 'react-native';
import type {
  CheckVocabularyAnswerResponse,
  VocabularyPracticeQuestion,
} from '@/api/generated/transport';
import { useTheme } from '@/hooks/use-theme';
import { AnswerFeedback } from '../AnswerFeedback';
import { AudioPrompt } from './components/AudioPrompt';
import { PictureOption } from './components/pictureOption';
import { WordPrompt } from './components/WordPrompt';
import { createStyles } from './styles';

type PictureExerciseProps = {
  question: VocabularyPracticeQuestion;
  answer: CheckVocabularyAnswerResponse | null;
  selectedOptionId: string | null;
  isSubmitting: boolean;
  onSelect: (optionId: string) => void;
};

export function PictureExercise({
  question,
  answer,
  selectedOptionId,
  isSubmitting,
  onSelect,
}: PictureExerciseProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      {question.kind === 'audio_to_picture' && question.prompt && (
        <AudioPrompt questionId={question.id} word={question.prompt} />
      )}
      {question.kind === 'word_to_picture' && question.prompt !== null && (
        <WordPrompt word={question.prompt} />
      )}
      <View style={styles.options} accessibilityRole="radiogroup">
        {question.options.map((option, index) => (
          <PictureOption
            key={option.id}
            option={option}
            position={index + 1}
            selected={selectedOptionId === option.id}
            checked={answer !== null}
            disabled={isSubmitting || answer !== null}
            correct={answer?.correctOptionId === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </View>
      {answer && <AnswerFeedback answer={answer} />}
    </>
  );
}
