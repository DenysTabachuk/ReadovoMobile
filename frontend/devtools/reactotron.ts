import reactotron from 'reactotron-react-native';
import { Platform } from 'react-native';

import { getDevServerHost } from '@/utils/devServerHost';

const isSupportedPlatform = Platform.OS === 'android' || Platform.OS === 'ios';

function getConfiguredHost() {
  const envHost = process.env.EXPO_PUBLIC_REACTOTRON_HOST?.trim();

  return getDevServerHost(envHost);
}

if (__DEV__ && isSupportedPlatform) {
  const host = getConfiguredHost();

  reactotron
    .configure({
      host,
      name: 'Readovo',
    })
    .useReactNative({
      asyncStorage: false,
    })
    .connect();

  console.log(`[Reactotron] connecting to ${host}:9090`);
  reactotron.clear?.();
}

export { reactotron };
