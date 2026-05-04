import { ActivityIndicator, View } from 'react-native';

import { ScreenContainer } from '@/components/screenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

export function FullScreenLoader() {
  const colorScheme = useColorScheme();

  return (
    <ScreenContainer>
      <View style={styles.loader}>
        <ActivityIndicator color={Colors[colorScheme].tint} size="large" />
      </View>
    </ScreenContainer>
  );
}
