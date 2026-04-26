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

export function TouchableWord({
  bold,
  contextSentence,
  italic,
  onPress,
  selected = false,
  text,
  tokenKey,
  word,
}: TouchableWordProps) {
  return (
    <ThemedText
      onPress={() =>
        onPress({
          context: contextSentence ?? '',
          tokenKey,
          word,
        })
      }
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
}
