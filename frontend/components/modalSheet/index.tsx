import { type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, type ThemedTextProps } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type ModalSheetProps = {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  showHandle?: boolean;
  title: string;
  titleType?: ThemedTextProps['type'];
  contentStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  modalProps?: Omit<
    ModalProps,
    'animationType' | 'onRequestClose' | 'transparent' | 'visible'
  >;
};

export function ModalSheet({
  children,
  contentStyle,
  footer,
  modalProps,
  onClose,
  open,
  sheetStyle,
  showHandle = false,
  title,
  titleType = 'sectionTitle',
}: ModalSheetProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const insets = useSafeAreaInsets();
  const closeButtonBorderColor = useThemeColor(
    { dark: '#4f5b62', light: '#d0d7de' },
    'icon',
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={open}
      {...modalProps}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.closeArea} />
        <View
          style={[
            styles.card,
            {
              backgroundColor,
              paddingBottom: Spacing.xLg + insets.bottom,
            },
            sheetStyle,
          ]}>
          {showHandle ? <View style={styles.handle} /> : null}

          <View style={[styles.content, contentStyle]}>
            <View style={styles.header}>
              <ThemedText type={titleType} style={styles.title}>
                {title}
              </ThemedText>
              <Pressable
                onPress={onClose}
                style={[styles.closeButton, { borderColor: closeButtonBorderColor }]}>
                <ThemedText type="bodyStrong">X</ThemedText>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>

          {footer}
        </View>
      </View>
    </Modal>
  );
}
