import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText, type ThemedTextProps } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type SheetHeaderProps = {
  onClose: () => void;
  title: string;
  titleType: ThemedTextProps['type'];
};

export function SheetHeader({ onClose, title, titleType }: SheetHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <ThemedText type={titleType} style={styles.title}>
        {title}
      </ThemedText>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <ThemedText type="bodyStrong">X</ThemedText>
      </Pressable>
    </View>
  );
}
