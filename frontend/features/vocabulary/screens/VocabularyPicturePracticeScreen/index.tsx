import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { PicturePractice } from '../../components/picturePractice';
import { COMMON_THINGS_LESSON_ID } from '../../fixtures/lessons';
import { styles } from './styles';

export default function VocabularyPicturePracticeScreen() {
  const { t } = useTranslation();

  return (
    <PicturePractice
      titleKey="vocabulary.practice.title"
      sampleKey="vocabulary.practice.sample"
      renderPrompt={(word) => (
        <View style={styles.prompt}>
          <ThemedText type="description">
            {t('vocabulary.practice.choosePicture')}
          </ThemedText>
          <ThemedText type="heroTitle" accessibilityLanguage="en-US">
            {word.word}
          </ThemedText>
        </View>
      )}
      resultAction={
        <Button
          onPress={() =>
            router.replace({
              pathname: '/(tabs)/(learning)/vocabulary/listening/[lessonId]',
              params: { lessonId: COMMON_THINGS_LESSON_ID },
            })
          }
        >
          {t('vocabulary.audio.start')}
        </Button>
      }
    />
  );
}
