import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAuthSessionStore } from '../utils/createAuthSessionStore';

export const authSessionStore = createAuthSessionStore(AsyncStorage);
