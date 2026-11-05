import { useTheme } from '@/hooks/use-theme';
import { useMemo, memo } from 'react';
import { ThemedText } from '@/components/themedText';
import { type InlineNode } from '@/features/articles/api';

import { View } from 'react-native';
import { createStyles } from '../../styles';
import { PlainInlineText } from '../plainInlineText';

export const PlainListItem = memo(function PlainListItem({
  item,
  itemIndex,
  onPress,
  ordered,
  prefix,
  speakingTokenKey,
}: {
  item: InlineNode[];
  itemIndex: number;
  onPress: () => void;
  ordered: boolean;
  prefix: string;
  speakingTokenKey?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.listItem}>
      <ThemedText style={styles.listBullet} type="paragraph">
        {ordered ? `${itemIndex + 1}.` : '\u2022'}
      </ThemedText>
      <PlainInlineText
        nodes={item}
        onPress={onPress}
        prefix={prefix}
        speakingTokenKey={speakingTokenKey}
        style={styles.listItemText}
      />
    </View>
  );
});
