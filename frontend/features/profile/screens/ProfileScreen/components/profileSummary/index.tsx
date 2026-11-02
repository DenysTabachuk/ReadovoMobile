import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themedText';
import type { AuthUserProfile } from '@/features/auth';
import { Mascot, type MascotEquippedItems } from '@/features/mascot';
import { styles } from './styles';

type ProfileSummaryProps = {
  user: AuthUserProfile;
  balance: number;
  equippedItems?: MascotEquippedItems;
};

export function ProfileSummary({
  user,
  balance,
  equippedItems,
}: ProfileSummaryProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const fallbackName = user.email?.split('@')[0] ?? t('profile.defaultName');
  const displayName = user.displayName ?? fallbackName;
  return (
    <View style={styles.profileCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.customizeMascotHint')}
        onPress={() => router.push('/wardrobe')}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed ? styles.avatarButtonPressed : null,
        ]}
      >
        <Mascot equippedItems={equippedItems} style={styles.avatar} />
      </Pressable>
      <View style={styles.profileMeta}>
        <ThemedText type="sectionTitle">{displayName}</ThemedText>
        <ThemedText style={styles.profileSubtitle}>
          {t('profile.subtitle')}
        </ThemedText>
        <ThemedText style={styles.mascotHint}>
          {t('profile.customizeMascotHint')}
        </ThemedText>
        <View style={styles.walletRow}>
          <View style={styles.walletItem}>
            <Image
              contentFit="contain"
              source={require('../../../../../../assets/images/money.png')}
              style={styles.walletIcon}
            />
            <ThemedText style={styles.walletText}>
              {t('profile.balance')}: {balance}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}
