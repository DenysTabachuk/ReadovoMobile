import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';

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

        <Button style={styles.continueButton} onPress={() => router.push('/about')}>
          {t('start.continue')}
        </Button>
      </View>
    </ScreenContainer>
  );
}
