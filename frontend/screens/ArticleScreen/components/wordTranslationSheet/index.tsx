import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type WordTranslationSheetProps = {
  context?: string;
  error: boolean;
  loading: boolean;
  onAddToDictionary: () => void;
  onClose: () => void;
  open: boolean;
  translation?: string;
  word?: string;
};

export function WordTranslationSheet({
  context,
  error,
  loading,
  onAddToDictionary,
  onClose,
  open,
  translation,
  word,
}: WordTranslationSheetProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const sheetBackgroundColor = useThemeColor({}, 'background');

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={open}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.closeArea} />
        <View style={[styles.sheet, { backgroundColor: sheetBackgroundColor }]}>
          <View style={styles.handle} />

          <View style={styles.content}>
            <ThemedText type="sectionTitle">
              {word ?? t('translation.titleFallback')}
            </ThemedText>

            {context ? (
              <ThemedText type="body" style={styles.contextText}>
                {context}
              </ThemedText>
            ) : null}

            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText type="body">{t('translation.loading')}</ThemedText>
              </View>
            ) : null}

            {!loading && error ? (
              <ThemedText type="body">{t('translation.error')}</ThemedText>
            ) : null}

            {!loading && !error && translation ? (
              <ThemedText type="paragraph" style={styles.translationText}>
                {translation}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button onPress={onAddToDictionary} variant="secondary">
              {t('translation.addToDictionary')}
            </Button>
            <Button onPress={onClose}>{t('translation.close')}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
