import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';

import { styles } from './styles';

const languages = [
  {
    code: 'en',
    flag: '\u{1F1FA}\u{1F1F8}',
    label: 'English',
  },
  {
    code: 'uk',
    flag: '\u{1F1FA}\u{1F1E6}',
    label: '\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430',
  },
];

export default function StartScreen() {
  const { i18n, t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <ThemedText type="heroTitle" style={styles.title}>
            {t('language.title')}
          </ThemedText>
          <ThemedText type="description" style={styles.description}>
            {t('language.description')}
          </ThemedText>
        </View>

        <View style={styles.languageList}>
          {languages.map((language) => {
            const isSelected = i18n.language === language.code;

            return (
              <Pressable
                key={language.code}
                style={[styles.languageButton, isSelected && styles.languageButtonSelected]}
                onPress={() => i18n.changeLanguage(language.code)}>
                <ThemedText type="emoji">{language.flag}</ThemedText>
                <ThemedText
                  type="buttonLabel"
                  style={isSelected && styles.languageLabelSelected}>
                  {language.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.continueButton} onPress={() => router.push('/about')}>
          <ThemedText type="buttonLabel" style={styles.continueButtonText}>
            {t('start.continue')}
          </ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
