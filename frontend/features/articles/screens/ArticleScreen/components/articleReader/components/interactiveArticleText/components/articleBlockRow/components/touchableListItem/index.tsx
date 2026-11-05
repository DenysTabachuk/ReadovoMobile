import { useTheme } from '@/hooks/use-theme';
import { useMemo, memo } from 'react';

import { type TouchableListItemProps } from './types';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { TouchableInlineText } from '../touchableInlineText';
import { areTouchableListItemPropsEqual } from './utils/areTouchableListItemPropsEqual';
import { createStyles } from '../../styles';

export const TouchableListItem = memo(function TouchableListItem({
  item,
  itemIndex,
  onWordPress,
  ordered,
  prefix,
  selectedTokenKeys,
  speakingTokenKey,
}: TouchableListItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
