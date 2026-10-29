import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

import { PronunciationButton } from '../pronunciationButton';
import { TranslationCards } from '../translationCards';

import { styles } from './styles';

type WordTranslationSheetProps = {
  baseTranslation?: string;
  context?: string;
  contextTranslation?: string;
  contextualTranslation?: string;
  error: unknown;
  isAddToDictionaryDisabled?: boolean;
  loading: boolean;
  onAddToDictionary: () => void;
  onClose: () => void;
  open: boolean;
  translation?: string;
  word?: string;
};

export function WordTranslationSheet({
  baseTranslation,
  context,
  contextTranslation,
  contextualTranslation,
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
  const errorMessageKey = error ? getApiErrorMessageKey(error) : null;

  return (
    <ModalSheet
      footer={
        <View style={styles.actions}>
          <Button
            disabled={isAddToDictionaryDisabled}
            onPress={onAddToDictionary}
            style={styles.actionButton}
            textStyle={styles.actionButtonText}
            variant="secondary"
          >
            {t('translation.addToDictionary')}
          </Button>
        </View>
      }
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      showHandle
      title={word ?? t('translation.titleFallback')}
    >
      <PronunciationButton word={word} />

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText type="body">{t('translation.loading')}</ThemedText>
        </View>
      ) : null}

      {!loading && errorMessageKey ? (
        <ThemedText type="body">{t(errorMessageKey)}</ThemedText>
      ) : null}

      {!loading && !error ? (
        <TranslationCards
          baseTranslation={baseTranslation}
          context={context}
          contextTranslation={contextTranslation}
          contextualTranslation={contextualTranslation}
          resetKey={word}
          translation={translation}
        />
      ) : null}
    </ModalSheet>
  );
}
