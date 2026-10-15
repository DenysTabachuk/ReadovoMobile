import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';

import { type ResultMessage, type ResultTier } from '../../types';

import { styles } from './styles';
import { resolveTierRingStyle } from './utils/resolveTierRingStyle';
import { resolveTierScoreGlowStyle } from './utils/resolveTierScoreGlowStyle';

type ResultScoreProps = {
  message: ResultMessage;
  percentage: number;
  tier: ResultTier;
};

export function ResultScore({ message, percentage, tier }: ResultScoreProps) {
  const tierScoreGlowStyle = resolveTierScoreGlowStyle(tier);

  return (
    <View style={styles.scoreOrbContainer}>
      <View style={[styles.scoreGlowOuter, tierScoreGlowStyle.outer]} />
      <View style={[styles.scoreGlowMid, tierScoreGlowStyle.mid]} />
      <View style={[styles.scoreGlowInner, tierScoreGlowStyle.inner]} />
      <View style={[styles.scoreCircle, resolveTierRingStyle(tier)]}>
        <ThemedText style={styles.scoreValue}>{`${percentage}%`}</ThemedText>
        <ThemedText type="sectionTitle" style={styles.messageTitle}>
          {message.title}
        </ThemedText>
        <ThemedText type="body" style={styles.messageSubtitle}>
          {message.subtitle}
        </ThemedText>
      </View>
    </View>
  );
}
