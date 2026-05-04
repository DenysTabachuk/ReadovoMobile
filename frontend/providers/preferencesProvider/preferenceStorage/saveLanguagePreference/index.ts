import { PreferenceStorageBackend, PREFERENCE_STORAGE_KEYS } from "../constants";
import { LanguagePreference } from "../../types";

export function saveLanguagePreference(
  storage: PreferenceStorageBackend,
  languagePreference: LanguagePreference,
): Promise<void> {
  return storage.setItem(PREFERENCE_STORAGE_KEYS.language, languagePreference);
}
