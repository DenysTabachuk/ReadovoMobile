import { type StyleProp, type ViewStyle, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreferences } from '@/providers/preferencesProvider';

import { LanguageOption } from './components/languageOption';
import { LANGUAGES, LANGUAGE_SELECTOR_BORDER_COLORS } from './constants';
import { styles } from './styles';

type LanguageSelectorProps = {
  style?: StyleProp<ViewStyle>;
};

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const colorScheme = useColorScheme();
  const { languagePreference, setLanguagePreference } = usePreferences();
  const borderColor =
    LANGUAGE_SELECTOR_BORDER_COLORS[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.languageList, style]}>
      {LANGUAGES.map((language) => (
        <LanguageOption
          borderColor={borderColor}
          isSelected={languagePreference === language.code}
          key={language.code}
          language={language}
          onSelect={setLanguagePreference}
        />
      ))}
    </View>
  );
}
