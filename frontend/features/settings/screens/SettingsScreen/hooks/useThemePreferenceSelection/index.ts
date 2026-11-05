import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBanner } from '@/components/banner';
import {
  usePreferences,
  type ThemePreference,
} from '@/providers/preferencesProvider';

/**
 * Presents persisted theme selection and catches storage failures for this screen.
 * Unmounting drops error feedback; the selector is disabled during a pending save.
 * Writes themselves belong to PreferencesProvider and continue after unmount.
 * @returns Committed selection, pending status and a non-promising selection action.
 * @example
 * const { selectTheme } = useThemePreferenceSelection();
 * selectTheme('system'); // Provider commits on save; the mounted screen reports a failed save.
 */
export function useThemePreferenceSelection() {
  const { themePreference, isSavingThemePreference, setThemePreference } =
    usePreferences();
  const { showBanner } = useBanner();
  const { t } = useTranslation();
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const selectTheme = (preference: ThemePreference) => {
    void setThemePreference(preference).catch(() => {
      if (!isMounted.current) return;
      showBanner({ title: t('settings.theme.saveError'), variant: 'error' });
    });
  };
  return { themePreference, isSavingThemePreference, selectTheme };
}
