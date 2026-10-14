import { PREFERENCE_STORAGE_KEYS } from '../constants';
import { type PreferenceStorageBackend } from '../types';

export function saveLearningReminderTime(
  storage: PreferenceStorageBackend,
  time: string,
): Promise<void> {
  return storage.setItem(PREFERENCE_STORAGE_KEYS.learningReminderTime, time);
}
