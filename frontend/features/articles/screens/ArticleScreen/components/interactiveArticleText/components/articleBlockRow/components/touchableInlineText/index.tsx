import { memo, useMemo } from 'react';
import { type TouchableInlineTextProps } from './types';
import { splitTextToTouchableParts } from '../../../../utils/splitTextToTouchableParts';
import { ThemedText } from '@/components/themedText';
import { TouchableTextParts } from '../touchableTextParts';
import { areTouchableInlineTextPropsEqual } from './utils/areTouchableInlineTextPropsEqual';

export const TouchableInlineText = memo(function TouchableInlineText({
  nodes,
  onWordPress,
  prefix,
  selectedTokenKeys,
  speakingTokenKey,
  style,
}: TouchableInlineTextProps) {
  const parts = useMemo(
    () => splitTextToTouchableParts(nodes, prefix),
    [nodes, prefix],
  );

  return (
    <ThemedText style={style} type="paragraph">
      <TouchableTextParts
        onWordPress={onWordPress}
        parts={parts}
        selectedTokenKeys={selectedTokenKeys}
        speakingTokenKey={speakingTokenKey}
      />
    </ThemedText>
  );
}, areTouchableInlineTextPropsEqual);
