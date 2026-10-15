import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthTokens } from '../../types';
import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
} from '../constants';

export async function persistAuthTokens(session: AuthTokens): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, session.accessToken),
    AsyncStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, session.refreshToken),
  ]);
}
