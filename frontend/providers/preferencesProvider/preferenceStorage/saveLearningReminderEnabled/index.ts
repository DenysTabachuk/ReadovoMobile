import { PreferenceStorageBackend, PREFERENCE_STORAGE_KEYS } from '../constants';

export function saveLearningReminderEnabled(
  storage: PreferenceStorageBackend,
  enabled: boolean,
): Promise<void> {
  return storage.setItem(PREFERENCE_STORAGE_KEYS.learningReminderEnabled, String(enabled));
}
