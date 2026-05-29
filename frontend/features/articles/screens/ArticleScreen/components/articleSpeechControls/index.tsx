import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type ArticleSpeechStatus = 'idle' | 'paused' | 'playing';

type ArticleSpeechControlsProps = {
  disabled?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  onRestart: () => void;
  onStop: () => void;
  onTogglePlayPause: () => void;
  progress: number;
  style?: StyleProp<ViewStyle>;
  status: ArticleSpeechStatus;
};

export function ArticleSpeechControls({
  disabled = false,
  onLayout,
  onRestart,
  onStop,
  onTogglePlayPause,
  progress,
  style,
  status,
}: ArticleSpeechControlsProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const isPlaying = status === 'playing';
  const isIdle = status === 'idle';
  const progressWidth: DimensionValue =
    `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;

  return (
    <View onLayout={onLayout} style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <ThemedText type="bodyStrong">{t('article.speech.title')}</ThemedText>
          <ThemedText type="description" style={styles.statusText}>
            {isPlaying
              ? t('article.speech.playing')
              : status === 'paused'
                ? t('article.speech.paused')
                : t('article.speech.ready')}
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <SpeechIconButton
            accessibilityLabel={
              isPlaying ? t('article.speech.pauseAction') : t('article.speech.playAction')
            }
            disabled={disabled}
            iconName={isPlaying ? 'pause' : 'play'}
            onPress={onTogglePlayPause}
            tintColor={tintColor}
            variant="primary"
          />
          <SpeechIconButton
            accessibilityLabel={t('article.speech.restartAction')}
            disabled={disabled}
            iconName="refresh"
            onPress={onRestart}
            tintColor={iconColor}
          />
          <SpeechIconButton
            accessibilityLabel={t('article.speech.stopAction')}
            disabled={disabled || isIdle}
            iconName="stop"
            onPress={onStop}
            tintColor={iconColor}
          />
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: tintColor,
              width: progressWidth,
            },
          ]}
        />
      </View>
    </View>
  );
}

function SpeechIconButton({
  accessibilityLabel,
  disabled,
  iconName,
  onPress,
  tintColor,
  variant = 'secondary',
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tintColor: string;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        variant === 'primary' ? styles.primaryIconButton : styles.secondaryIconButton,
        pressed && !disabled ? styles.iconButtonPressed : null,
        disabled ? styles.iconButtonDisabled : null,
      ]}>
      <Ionicons
        color={variant === 'primary' ? '#ffffff' : tintColor}
        name={iconName}
        size={20}
      />
    </Pressable>
  );
}
