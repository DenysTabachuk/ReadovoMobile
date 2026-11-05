import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { CheckboxIndicator } from '@/components/checkboxRow';
import { ThemedText } from '@/components/themedText';

import { QUIZ_STATUS_ICON_SIZE } from '../../constants';
import { type QuizQuestion } from '../../../../types';

import { createStyles } from './styles';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isMultipleChoice = question.type === 'multiple_choice';

  return (
    <View style={styles.options}>
      {question.options.map((option) => {
        const isSelected = selectedOptionIds.includes(option.id);
        const isCorrectOption = resolvedCorrectOptionIds.includes(option.id);
        const shouldShowCorrectState = isSubmitted && isCorrectOption;
        const shouldShowWrongState =
          isSubmitted && isSelected && !isCorrectOption;
        let checkedColor = colors.onPrimary;
        if (isSubmitted) {
          checkedColor = shouldShowWrongState ? colors.danger : colors.success;
        }

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
                  checkedColor={checkedColor}
                  uncheckedColor={colors.borderStrong}
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
                color={shouldShowCorrectState ? colors.success : colors.danger}
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
