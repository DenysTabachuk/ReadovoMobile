import { type LanguagePreference } from '@/providers/preferencesProvider';

export type LanguageOption = {
  code: LanguagePreference;
  flag: string;
  label: string;
};
