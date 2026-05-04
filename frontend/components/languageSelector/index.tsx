import { Pressable, type StyleProp, type ViewStyle, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  type LanguagePreference,
  usePreferences,
} from '@/providers/preferencesProvider';

import { styles } from './styles';

const languages = [
  {
    code: 'en',
    flag: '🇺🇸',
    label: 'English',
  },
  {
    code: 'uk',
    flag: '🇺🇦',
    label: 'Українська',
  },
] satisfies {
  code: LanguagePreference;
  flag: string;
  label: string;
}[];

type LanguageSelectorProps = {
  style?: StyleProp<ViewStyle>;
};

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const colorScheme = useColorScheme();
  const { languagePreference, setLanguagePreference } = usePreferences();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';

  return (
    <View style={[styles.languageList, style]}>
      {languages.map((language) => {
        const isSelected = languagePreference === language.code;

        return (
          <Pressable
            key={language.code}
            onPress={() => {
              void setLanguagePreference(language.code);
            }}
            style={[
              styles.languageButton,
              { borderColor },
              isSelected ? styles.languageButtonSelected : null,
            ]}>
            <ThemedText type="emoji">{language.flag}</ThemedText>
            <ThemedText
              numberOfLines={1}
              type="buttonLabel"
              style={[
                styles.languageLabel,
                isSelected ? styles.selectedLanguageText : null,
              ]}>
              {language.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
