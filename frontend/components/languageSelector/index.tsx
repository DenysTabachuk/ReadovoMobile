import { Pressable, type StyleProp, type ViewStyle, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
];

type LanguageSelectorProps = {
  style?: StyleProp<ViewStyle>;
};

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const selectedLanguageCode = i18n.language.split('-')[0];

  return (
    <View style={[styles.languageList, style]}>
      {languages.map((language) => {
        const isSelected = selectedLanguageCode === language.code;

        return (
          <Pressable
            key={language.code}
            onPress={() => i18n.changeLanguage(language.code)}
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
