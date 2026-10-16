import { memo, useMemo, Fragment } from 'react';
import { type PlainInlineTextProps } from './types';
import { ENABLE_SPEECH_SENTENCE_HIGHLIGHT } from '../../../../constants';
import { isTokenKeyInsidePrefix } from '../../utils/isTokenKeyInsidePrefix';
import { splitTextToTouchableParts } from '../../../../utils/splitTextToTouchableParts';
import { normalizeInlineNodesForWordSelection } from '../../utils/normalizeInlineNodesForWordSelection';
import { getSpeakingSentenceKey } from '../../utils/getSpeakingSentenceKey';
import { createSentenceGroups } from '../../utils/createSentenceGroups';
import { ThemedText } from '@/components/themedText';
import { createPlainTextSegments } from './utils/createPlainTextSegments';
import { type TouchableTextPart } from '../../../../types';
import { styles } from '../../styles';

export const PlainInlineText = memo(function PlainInlineText({
  nodes,
  onPress,
  prefix,
  speakingTokenKey,
  style,
}: PlainInlineTextProps) {
  const shouldHighlightSentence =
    ENABLE_SPEECH_SENTENCE_HIGHLIGHT &&
    isTokenKeyInsidePrefix(speakingTokenKey, prefix);
  const highlightedSentenceContent = useMemo(() => {
    if (!shouldHighlightSentence) {
      return null;
    }

    const parts = splitTextToTouchableParts(
      normalizeInlineNodesForWordSelection(nodes),
      prefix,
    );
    const speakingSentenceKey = getSpeakingSentenceKey(parts, speakingTokenKey);

    if (!speakingSentenceKey) {
      return null;
    }

    return createSentenceGroups(parts).map((group) => {
      const renderedParts = group.parts.map(renderPlainTouchablePart);

      if (group.sentenceKey === speakingSentenceKey) {
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
  }, [nodes, prefix, shouldHighlightSentence, speakingTokenKey]);
  const segments = useMemo(() => createPlainTextSegments(nodes), [nodes]);

  if (highlightedSentenceContent) {
    return (
      <ThemedText onPress={onPress} style={style} type="paragraph">
        {highlightedSentenceContent}
      </ThemedText>
    );
  }

  if (segments.length === 1) {
    const segment = segments[0];

    return (
      <ThemedText
        onPress={onPress}
        style={[
          style,
          segment?.bold ? styles.inlineBold : null,
          segment?.italic ? styles.inlineItalic : null,
        ]}
        type="paragraph"
      >
        {segment?.text ?? ''}
      </ThemedText>
    );
  }

  return (
    <ThemedText onPress={onPress} style={style} type="paragraph">
      {segments.map((segment) => (
        <ThemedText
          key={segment.key}
          onPress={onPress}
          style={[
            segment.bold ? styles.inlineBold : null,
            segment.italic ? styles.inlineItalic : null,
          ]}
          type="paragraph"
        >
          {segment.text}
        </ThemedText>
      ))}
    </ThemedText>
  );
});

function renderPlainTouchablePart(part: TouchableTextPart) {
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
