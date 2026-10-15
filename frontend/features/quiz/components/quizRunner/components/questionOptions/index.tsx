import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { CheckboxIndicator } from '@/components/checkboxRow';
import { ThemedText } from '@/components/themedText';

import {
  QUIZ_ANSWER_COLORS,
  QUIZ_OPTION_COLORS,
  QUIZ_STATUS_ICON_SIZE,
} from '../../constants';
import { type QuizQuestion } from '../../../../types';

import { styles } from './styles';

type QuestionOptionsProps = {
  isSubmitted: boolean;
  isSubmitting: boolean;
  onSelectOption: (optionId: string) => void;
  question: QuizQuestion;
  resolvedCorrectOptionIds: string[];
  selectedOptionIds: string[];
};

export function QuestionOptions({
  isSubmitted,
  isSubmitting,
  onSelectOption,
  question,
  resolvedCorrectOptionIds,
  selectedOptionIds,
}: QuestionOptionsProps) {
  const isMultipleChoice = question.type === 'multiple_choice';

  return (
    <View style={styles.options}>
      {question.options.map((option) => {
        const isSelected = selectedOptionIds.includes(option.id);
        const isCorrectOption = resolvedCorrectOptionIds.includes(option.id);
        const shouldShowCorrectState = isSubmitted && isCorrectOption;
        const shouldShowWrongState =
          isSubmitted && isSelected && !isCorrectOption;

        return (
          <Pressable
            disabled={isSubmitted || isSubmitting}
            key={option.id}
            onPress={() => onSelectOption(option.id)}
            style={({ pressed }) => [
              styles.optionButton,
              isSelected ? styles.selectedOption : styles.unselectedOption,
              pressed && !isSubmitted && !isSubmitting
                ? styles.pressedOption
                : null,
              shouldShowCorrectState ? styles.correctOption : null,
              shouldShowWrongState ? styles.wrongOption : null,
              isSubmitting ? styles.disabledOption : null,
            ]}
          >
            {isMultipleChoice ? (
              <View style={styles.checkboxIndicator}>
                <CheckboxIndicator
                  checked={isSelected}
                  checkedColor={
                    isSubmitted
                      ? shouldShowWrongState
                        ? QUIZ_ANSWER_COLORS.wrong
                        : QUIZ_ANSWER_COLORS.correct
                      : QUIZ_OPTION_COLORS.checked
                  }
                  uncheckedColor={QUIZ_OPTION_COLORS.unchecked}
                />
              </View>
            ) : null}
            <ThemedText
              type="buttonLabel"
              style={[
                styles.optionText,
                isSelected
                  ? styles.selectedOptionText
                  : styles.unselectedOptionText,
                shouldShowCorrectState ? styles.correctOptionText : null,
                shouldShowWrongState ? styles.wrongOptionText : null,
              ]}
            >
              {option.text}
            </ThemedText>
            {shouldShowCorrectState || shouldShowWrongState ? (
              <Ionicons
                color={
                  shouldShowCorrectState
                    ? QUIZ_ANSWER_COLORS.correct
                    : QUIZ_ANSWER_COLORS.wrong
                }
                name={
                  shouldShowCorrectState ? 'checkmark-circle' : 'close-circle'
                }
                size={QUIZ_STATUS_ICON_SIZE}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
