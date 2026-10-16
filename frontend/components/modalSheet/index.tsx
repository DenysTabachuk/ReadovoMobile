import { useEffect, type ReactNode } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemedTextProps } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { SheetHeader } from './components/sheetHeader';
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
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = useThemeColor({}, 'background');
  const insets = useSafeAreaInsets();
  const footerBottomInset =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, Spacing.xLg)
      : insets.bottom;
  const contentBottomInset =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, Spacing.md)
      : insets.bottom;
  const appBackgroundColor = Colors[colorScheme].background;

  useEffect(() => {
    if (Platform.OS !== 'android' || !open) {
      return;
    }

    void NavigationBar.setBackgroundColorAsync(appBackgroundColor);
    void NavigationBar.setButtonStyleAsync(
      colorScheme === 'dark' ? 'light' : 'dark',
    );
  }, [appBackgroundColor, colorScheme, open]);

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      transparent
      visible={open}
      {...modalProps}
    >
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.closeArea} />
        <View
          style={[
            styles.card,
            {
              backgroundColor,
              paddingBottom: Spacing.xLg,
            },
            sheetStyle,
          ]}
        >
          {showHandle ? <View style={styles.handle} /> : null}

          <View style={[styles.content, contentStyle]}>
            <SheetHeader
              onClose={onClose}
              title={title}
              titleType={titleType}
            />

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Spacing.md + contentBottomInset },
              ]}
              keyboardShouldPersistTaps="handled"
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>

          {footer ? (
            <View
              style={[
                styles.footerContainer,
                { paddingBottom: Spacing.md + footerBottomInset },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
