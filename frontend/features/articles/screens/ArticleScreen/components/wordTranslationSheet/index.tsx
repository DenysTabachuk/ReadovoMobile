import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { PronunciationButton } from '@/components/pronunciationButton';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type WordTranslationSheetProps = {
  context?: string;
  error: boolean;
  isAddToDictionaryDisabled?: boolean;
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
  isAddToDictionaryDisabled,
  loading,
  onAddToDictionary,
  onClose,
  open,
  translation,
  word,
}: WordTranslationSheetProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  return (
    <ModalSheet
      footer={
        <View style={styles.actions}>
          <Button
            disabled={isAddToDictionaryDisabled}
            onPress={onAddToDictionary}
            style={styles.actionButton}
            textStyle={styles.actionButtonText}
            variant="secondary">
            {t('translation.addToDictionary')}
          </Button>
        </View>
      }
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      showHandle
      title={word ?? t('translation.titleFallback')}>
      <PronunciationButton word={word} />

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
    </ModalSheet>
  );
}
