import { PREFERENCE_STORAGE_KEYS } from '../constants';
import { type PreferenceStorageBackend } from '../types';
import { type LanguagePreference } from '../../types';

export function saveLanguagePreference(
  storage: PreferenceStorageBackend,
  languagePreference: LanguagePreference,
): Promise<void> {
  return storage.setItem(PREFERENCE_STORAGE_KEYS.language, languagePreference);
}
