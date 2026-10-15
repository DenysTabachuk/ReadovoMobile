import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH_REFRESH_TOKEN_STORAGE_KEY } from '../constants';

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
}
