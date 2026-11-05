import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { type LanguagePreference } from '@/providers/preferencesProvider';

import { type LanguageOption as LanguageOptionValue } from '../../types';

import { createStyles } from './styles';

type LanguageOptionProps = {
  borderColor: string;
  isSelected: boolean;
  language: LanguageOptionValue;
  onSelect: (language: LanguagePreference) => Promise<void> | void;
};

export function LanguageOption({
  borderColor,
  isSelected,
  language,
  onSelect,
}: LanguageOptionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => {
        void onSelect(language.code);
      }}
      style={[
        styles.languageButton,
        { borderColor },
        isSelected ? styles.languageButtonSelected : null,
      ]}
    >
      <ThemedText type="emoji">{language.flag}</ThemedText>
      <ThemedText
        numberOfLines={1}
        type="buttonLabel"
        style={[
          styles.languageLabel,
          isSelected ? styles.selectedLanguageText : null,
        ]}
      >
        {language.label}
      </ThemedText>
    </Pressable>
  );
}
