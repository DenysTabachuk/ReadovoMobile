import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import {
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { styles } from './styles';

type QuizExitConfirmationProps = { active: boolean };

export function QuizExitConfirmation({ active }: QuizExitConfirmationProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(
    null,
  );
  usePreventRemove(active, ({ data }) => setPendingAction(data.action));
  const close = () => setPendingAction(null);
  const confirm = () => {
    if (pendingAction) navigation.dispatch(pendingAction);
    else router.back();
    close();
  };

  return (
    <ModalSheet
      open={pendingAction !== null}
      onClose={close}
      title={t('dictionary.test.exitTitle')}
      footer={
        <View style={styles.confirmModalActions}>
          <Button
            onPress={close}
            style={styles.confirmModalButton}
            variant="secondary"
          >
            {t('dictionary.test.exitCancel')}
          </Button>
          <Button onPress={confirm} style={styles.confirmModalButton}>
            {t('dictionary.test.exitConfirm')}
          </Button>
        </View>
      }
    >
      <ThemedText type="body">
        {t('dictionary.test.exitDescription')}
      </ThemedText>
    </ModalSheet>
  );
}
