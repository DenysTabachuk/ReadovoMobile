import { PropsWithChildren, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/iconSymbol';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

type CollapsibleProps = PropsWithChildren & { title: string };

export function Collapsible({ children, title }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={colors.textSecondary}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}
