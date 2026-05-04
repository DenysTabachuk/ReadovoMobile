import { PreferenceStorageBackend, PREFERENCE_STORAGE_KEYS } from "../constants";
import { ThemePreference } from "../../types";

export function saveThemePreference(
  storage: PreferenceStorageBackend,
  themePreference: ThemePreference,
): Promise<void> {
  return storage.setItem(PREFERENCE_STORAGE_KEYS.theme, themePreference);
}
