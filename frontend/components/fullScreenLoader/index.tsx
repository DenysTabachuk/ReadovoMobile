import { ActivityIndicator, View } from 'react-native';

import { ScreenContainer } from '@/components/screenContainer';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export function FullScreenLoader() {
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.loader}>
        <ActivityIndicator color={colors.interactive} size="large" />
      </View>
    </ScreenContainer>
  );
}
