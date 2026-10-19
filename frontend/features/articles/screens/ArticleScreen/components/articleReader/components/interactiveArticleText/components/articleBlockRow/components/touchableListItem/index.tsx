import { memo } from 'react';
import { type TouchableListItemProps } from './types';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { TouchableInlineText } from '../touchableInlineText';
import { areTouchableListItemPropsEqual } from './utils/areTouchableListItemPropsEqual';
import { styles } from '../../styles';

export const TouchableListItem = memo(function TouchableListItem({
  item,
  itemIndex,
  onWordPress,
  ordered,
  prefix,
  selectedTokenKeys,
  speakingTokenKey,
}: TouchableListItemProps) {
  return (
    <View style={styles.listItem}>
      <ThemedText style={styles.listBullet} type="paragraph">
        {ordered ? `${itemIndex + 1}.` : '\u2022'}
      </ThemedText>
      <TouchableInlineText
        nodes={item}
        onWordPress={onWordPress}
        prefix={prefix}
        selectedTokenKeys={selectedTokenKeys}
        speakingTokenKey={speakingTokenKey}
        style={styles.listItemText}
      />
    </View>
  );
}, areTouchableListItemPropsEqual);
