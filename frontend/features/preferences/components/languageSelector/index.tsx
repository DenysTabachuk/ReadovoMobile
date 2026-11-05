import { useTheme } from '@/hooks/use-theme';
import { type StyleProp, type ViewStyle, View } from 'react-native';

import { usePreferences } from '@/providers/preferencesProvider';

import { LanguageOption } from './components/languageOption';
import { LANGUAGES } from './constants';
import { styles } from './styles';

type LanguageSelectorProps = {
  style?: StyleProp<ViewStyle>;
};

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const { colors } = useTheme();
  const { languagePreference, setLanguagePreference } = usePreferences();

  return (
    <View style={[styles.languageList, style]}>
      {LANGUAGES.map((language) => (
        <LanguageOption
          borderColor={colors.border}
          isSelected={languagePreference === language.code}
          key={language.code}
          language={language}
          onSelect={setLanguagePreference}
        />
      ))}
    </View>
  );
}
