import { type LanguageOption } from './types';

export const LANGUAGES = [
  {
    code: 'en',
    flag: '🇺🇸',
    label: 'English',
  },
  {
    code: 'uk',
    flag: '🇺🇦',
    label: 'Українська',
  },
] satisfies LanguageOption[];

export const LANGUAGE_SELECTOR_BORDER_COLORS = {
  dark: '#2d3336',
  light: '#d0d7de',
} as const;
