import { usePreferences } from '@/providers/preferencesProvider';

export function useColorScheme() {
  return usePreferences().colorScheme;
}
