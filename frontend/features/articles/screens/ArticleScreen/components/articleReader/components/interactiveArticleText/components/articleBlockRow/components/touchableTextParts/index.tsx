import { useTheme } from '@/hooks/use-theme';
import { useMemo, Fragment } from 'react';
import {
  type InteractiveArticleTextProps,
  type TouchableTextPart,
} from '../../../../types';
import {
  ENABLE_SPEECH_SENTENCE_HIGHLIGHT,
  ENABLE_SPEECH_WORD_HIGHLIGHT,
} from '../../../../constants';
import { getSpeakingSentenceKey } from '../../utils/getSpeakingSentenceKey';
import { createSentenceGroups } from '../../utils/createSentenceGroups';
import { ThemedText } from '@/components/themedText';

import { TouchableWord } from '../../../../../../../touchableWord';
import { createStyles } from '../../styles';

type RenderTouchablePartParams = {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  part: TouchableTextPart;
  selectedTokenKeySet: ReadonlySet<string>;
  speakingTokenKey?: string;
  styles: ReturnType<typeof createStyles>;
};

type TouchableTextPartsProps = {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  parts: TouchableTextPart[];
  selectedTokenKey?: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
};

export function TouchableTextParts(params: TouchableTextPartsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const selectedTokenKeySet = new Set([
    ...(params.selectedTokenKeys ?? []),
    ...(params.selectedTokenKey ? [params.selectedTokenKey] : []),
  ]);
  const speakingSentenceKey = ENABLE_SPEECH_SENTENCE_HIGHLIGHT
    ? getSpeakingSentenceKey(params.parts, params.speakingTokenKey)
    : undefined;
  const sentenceGroups = createSentenceGroups(params.parts);

  return sentenceGroups.map((group) => {
    const renderedParts = group.parts.map((part) =>
      renderTouchablePart({
        onWordPress: params.onWordPress,
        part,
        styles,
        selectedTokenKeySet,
        speakingTokenKey: ENABLE_SPEECH_WORD_HIGHLIGHT
          ? params.speakingTokenKey
          : undefined,
      }),
    );

    if (group.sentenceKey && group.sentenceKey === speakingSentenceKey) {
      return (
        <ThemedText
          key={group.key}
          style={styles.speakingSentence}
          type="paragraph"
        >
          {renderedParts}
        </ThemedText>
      );
    }

    return <Fragment key={group.key}>{renderedParts}</Fragment>;
  });
}

function renderTouchablePart(params: RenderTouchablePartParams) {
  const { part, styles } = params;

  if (part.type === 'text') {
    return (
      <ThemedText
        key={part.key}
        style={[
          part.bold ? styles.inlineBold : null,
          part.italic ? styles.inlineItalic : null,
        ]}
        type="paragraph"
      >
        {part.text}
      </ThemedText>
    );
  }

  return (
    <TouchableWord
      key={part.key}
      bold={part.bold}
      contextSentence={part.contextSentence}
      italic={part.italic}
      onPress={params.onWordPress}
      selected={params.selectedTokenKeySet.has(part.key)}
      sentenceKey={part.sentenceKey}
      sentenceWordIndex={part.sentenceWordIndex}
      speaking={params.speakingTokenKey === part.key}
      text={part.text}
      tokenKey={part.key}
      word={part.word}
    />
  );
}
