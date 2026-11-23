import { useMemo } from 'react';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { PracticeOption } from '../../../PracticeOption';
import type { PracticeOptionInteractionProps } from '../../../PracticeOption/types';
import { createStyles } from './styles';

type WordOptionProps = PracticeOptionInteractionProps & {
  word: string;
};

export function WordOption({ word, ...optionProps }: WordOptionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <PracticeOption
      accessibilityLabel={word}
      accessibilityLanguage="en-US"
      {...optionProps}
      style={styles.option}
      iconSize={24}
    >
      {(outcomeIcon) => (
        <>
          <ThemedText type="bodyStrong" style={styles.word}>
            {word}
          </ThemedText>
          {outcomeIcon}
        </>
      )}
    </PracticeOption>
  );
}
