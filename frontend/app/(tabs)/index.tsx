import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title">Speakly</ThemedText>
        <ThemedText style={styles.description}>
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
    paddingHorizontal: 24,
  },
  content: {
    gap: 12,
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
    maxWidth: 420,
  },
});
