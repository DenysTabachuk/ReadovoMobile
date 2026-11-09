import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { ImageWithFallback } from '@/components/imageWithFallback';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { VocabularyWordCard } from '../../../../fixtures/wordCards';
import { createStyles } from './styles';

type PictureOptionProps = {
  option: VocabularyWordCard;
  position: number;
  selected: boolean;
  checked: boolean;
  correct: boolean;
  onSelect: () => void;
};

export function PictureOption({
  option,
  position,
  selected,
  checked,
  correct,
  onSelect,
}: PictureOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  let outcomeStyle: StyleProp<ViewStyle>;
  let outcomeIcon;
  if (checked && correct) {
    outcomeStyle = styles.correct;
    outcomeIcon = (
      <MaterialIcons name="check-circle" size={28} color={colors.success} />
    );
  } else if (checked && selected) {
    outcomeStyle = styles.incorrect;
    outcomeIcon = (
      <MaterialIcons name="cancel" size={28} color={colors.danger} />
    );
  }

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={t(option.translationKey)}
      accessibilityState={{ selected, disabled: checked }}
      disabled={checked}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        outcomeStyle,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.picture}>
        <ImageWithFallback
          source={option.image}
          style={styles.image}
          contentFit="contain"
          accessible={false}
        />
      </View>
      <View style={styles.label}>
        <ThemedText type="bodyStrong">
          {checked
            ? option.word
            : t('vocabulary.practice.pictureNumber', { number: position })}
        </ThemedText>
        {outcomeIcon}
      </View>
    </Pressable>
  );
}
