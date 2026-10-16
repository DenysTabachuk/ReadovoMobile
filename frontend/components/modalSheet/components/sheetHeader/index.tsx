import { Pressable, View } from 'react-native';
import { ThemedText, type ThemedTextProps } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';
import { styles } from './styles';

type SheetHeaderProps = {
  onClose: () => void;
  title: string;
  titleType: ThemedTextProps['type'];
};

export function SheetHeader({ onClose, title, titleType }: SheetHeaderProps) {
  const closeButtonBorderColor = useThemeColor(
    { dark: '#4f5b62', light: '#d0d7de' },
    'icon',
  );

  return (
    <View style={styles.header}>
      <ThemedText type={titleType} style={styles.title}>
        {title}
      </ThemedText>
      <Pressable
        onPress={onClose}
        style={[styles.closeButton, { borderColor: closeButtonBorderColor }]}
      >
        <ThemedText type="bodyStrong">X</ThemedText>
      </Pressable>
    </View>
  );
}
