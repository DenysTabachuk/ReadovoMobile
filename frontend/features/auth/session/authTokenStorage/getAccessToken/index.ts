import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH_ACCESS_TOKEN_STORAGE_KEY } from '../constants';

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
}
