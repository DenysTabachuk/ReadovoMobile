import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { themeColors } from './theme';

export const navigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: themeColors.light.interactive,
      background: themeColors.light.background,
      card: themeColors.light.background,
      text: themeColors.light.text,
      border: themeColors.light.borderSubtle,
      notification: themeColors.light.danger,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: themeColors.dark.interactive,
      background: themeColors.dark.background,
      card: themeColors.dark.background,
      text: themeColors.dark.text,
      border: themeColors.dark.borderSubtle,
      notification: themeColors.dark.danger,
    },
  },
} satisfies Record<'light' | 'dark', NavigationTheme>;
