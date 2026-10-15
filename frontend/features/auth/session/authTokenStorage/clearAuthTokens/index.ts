import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
} from '../constants';

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY),
    AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
  ]);
}
