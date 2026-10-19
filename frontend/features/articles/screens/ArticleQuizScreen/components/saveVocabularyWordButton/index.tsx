import { Button } from '@/components/button';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';

type SaveVocabularyWordButtonProps = {
  saved: boolean;
  saving: boolean;
  onSave: () => void;
};

export function SaveVocabularyWordButton({
  saved,
  saving,
  onSave,
}: SaveVocabularyWordButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      disabled={saved || saving}
      onPress={onSave}
      style={styles.quizFooterButton}
      variant="secondary"
    >
      {saved
        ? t('dictionary.saved')
        : saving
          ? t('common.loading', { defaultValue: 'Saving...' })
          : t('translation.addToDictionary')}
    </Button>
  );
}
