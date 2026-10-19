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
import { Fragment } from 'react';
import { TouchableWord } from '../../../../../../../touchableWord';
import { styles } from '../../styles';

export function TouchableTextParts(params: {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  parts: TouchableTextPart[];
  selectedTokenKey?: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
}) {
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

function renderTouchablePart(params: {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  part: TouchableTextPart;
  selectedTokenKeySet: ReadonlySet<string>;
  speakingTokenKey?: string;
}) {
  const { part } = params;

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
