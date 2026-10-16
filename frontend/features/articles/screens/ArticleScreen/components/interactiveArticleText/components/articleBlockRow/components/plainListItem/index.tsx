import { memo } from 'react';
import { type InlineNode } from '@/features/articles/api/wikipedia';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { PlainInlineText } from '../plainInlineText';
import { styles } from '../../styles';

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
