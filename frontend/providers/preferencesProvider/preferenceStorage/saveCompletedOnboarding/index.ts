import { PREFERENCE_STORAGE_KEYS } from "../constants";
import { PreferenceStorageBackend } from "../types";

export function saveCompletedOnboarding(
  storage: PreferenceStorageBackend,
): Promise<void> {
  return storage.setItem(PREFERENCE_STORAGE_KEYS.onboarding, 'true');
}
