import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { styles } from './styles';

/** Renders the profile title and keeps settings accessible while profile data loads. */
export function ProfileHeader() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <ThemedText type="screenTitle">{t('profile.title')}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.title')}
        onPress={() => router.push('/settings')}
        style={styles.settingsButton}
      >
        <Ionicons name="settings" size={28} color={colors.interactive} />
      </Pressable>
    </View>
  );
}
