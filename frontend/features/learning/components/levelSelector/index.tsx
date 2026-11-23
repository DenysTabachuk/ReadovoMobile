import { useTranslation } from 'react-i18next';
import type { VocabularyLevel } from '@/api/generated/transport';
import { OptionPickerField } from '@/components/optionPickerField';

type LevelSelectorProps = {
  levels: VocabularyLevel[];
  selected: VocabularyLevel;
  onSelect: (level: VocabularyLevel) => void;
};

export function LevelSelector({
  levels,
  selected,
  onSelect,
}: LevelSelectorProps) {
  const { t } = useTranslation();
  return (
    <OptionPickerField
      variant="pill"
      label={t('learning.topics.englishLevel')}
      title={t('learning.topics.englishLevel')}
      options={levels.map((level) => ({
        value: level,
        displayLabel: level,
        label: t(`article.levels.${level}`),
      }))}
      selectedValue={selected}
      onSelect={onSelect}
    />
  );
}
