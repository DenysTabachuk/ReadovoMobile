import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type LessonPathProps = {
  steps: {
    id: string;
    title: string;
    description: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    available: boolean;
    onPress: () => void;
  }[];
};

export function LessonPath({ steps }: LessonPathProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.path}>
      <ThemedText type="sectionTitle">{t('learning.lesson.path')}</ThemedText>
      {steps.map((step, index) => (
        <Pressable
          key={step.id}
          accessibilityRole="button"
          accessibilityLabel={step.title}
          accessibilityState={{ disabled: !step.available }}
          disabled={!step.available}
          onPress={step.onPress}
          style={({ pressed }) => [
            styles.step,
            index === 0 && styles.firstStep,
            !step.available && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.number}>
            <ThemedText type="bodyStrong">{index + 1}</ThemedText>
          </View>
          <Ionicons
            name={step.icon}
            size={26}
            color={colors.interactive}
            accessible={false}
          />
          <View style={styles.copy}>
            <ThemedText type="bodyStrong">{step.title}</ThemedText>
            <ThemedText style={styles.secondary}>{step.description}</ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
            accessible={false}
          />
        </Pressable>
      ))}
    </View>
  );
}
