import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Spacing } from '@/constants/spacing';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="screenTitle">Speakly</ThemedText>
        <ThemedText type="description" style={styles.description}>
          Practice conversations, build vocabulary, and keep your language learning moving every
          day.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xLg,
  },
  content: {
    gap: Spacing.md,
  },
  description: {
    maxWidth: 420,
  },
});
