import { memo, useCallback } from 'react';

import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

type TouchableWordProps = {
  bold?: boolean;
  contextSentence?: string;
  italic?: boolean;
  onPress: (selection: {
    context: string;
    tokenKey: string;
    word: string;
  }) => void;
  selected?: boolean;
  text: string;
  tokenKey: string;
  word: string;
};

export const TouchableWord = memo(function TouchableWord({
  bold,
  contextSentence,
  italic,
  onPress,
  selected = false,
  text,
  tokenKey,
  word,
}: TouchableWordProps) {
  const handlePress = useCallback(() => {
    onPress({
      context: contextSentence ?? '',
      tokenKey,
      word,
    });
  }, [contextSentence, onPress, tokenKey, word]);

  return (
    <ThemedText
      onPress={handlePress}
      style={[
        styles.word,
        bold ? styles.bold : null,
        italic ? styles.italic : null,
        selected ? styles.selectedWord : null,
        selected ? styles.selectedWordText : null,
      ]}
      type="paragraph">
      {text}
    </ThemedText>
  );
});
