import { Platform } from 'react-native';
import { palette } from './palette';

export type ThemeColors = Record<keyof typeof lightColors, string>;
export type Theme = 'light' | 'dark';

// Roles remain distinct even when they currently share a palette shade.
const lightColors = {
  background: palette.white,
  surface: palette.gray100,
  surfaceMuted: palette.gray150,
  text: palette.gray950,
  textSecondary: palette.gray600,
  primary: palette.blue600,
  onPrimary: palette.white,
  link: palette.blue600,
  accent: palette.blue600,
  border: palette.gray300,
  borderSubtle: palette.gray200,
  borderStrong: palette.gray300,
  inputBorder: palette.gray450,
  placeholder: palette.gray575,
  focus: palette.indigo500,
  selection: palette.blue100,
  selectionBorder: palette.blue600,
  success: palette.green700,
  danger: palette.red600,
  handle: palette.gray400,
  floatingAction: palette.purple600,
  onFloatingAction: palette.white,
  checkboxBorder: palette.blueGray500,
  backdrop: palette.blackOverlay,
  tabIconDefault: palette.gray550,
};

export const themeColors = {
  light: lightColors,
  dark: {
    background: palette.gray925,
    surface: palette.gray840,
    surfaceMuted: palette.gray850,
    text: palette.gray175,
    textSecondary: palette.gray500,
    primary: palette.blue600,
    onPrimary: palette.white,
    link: palette.blue300,
    accent: palette.white,
    border: palette.gray800,
    borderSubtle: palette.gray825,
    borderStrong: palette.gray700,
    inputBorder: palette.gray450,
    placeholder: palette.gray425,
    focus: palette.indigo500,
    selection: palette.blue900,
    selectionBorder: palette.blue300,
    success: palette.green300,
    danger: palette.red400,
    handle: palette.gray400,
    floatingAction: palette.purple500,
    onFloatingAction: palette.white,
    checkboxBorder: palette.blueGray500,
    backdrop: palette.blackOverlay,
    tabIconDefault: palette.gray525,
  },
} satisfies Record<Theme, ThemeColors>;

// Temporary adapter for feature consumers awaiting stage 2 migration.
export const Colors = {
  light: {
    ...themeColors.light,
    tint: themeColors.light.accent,
    icon: themeColors.light.textSecondary,
    tabIconSelected: themeColors.light.accent,
  },
  dark: {
    ...themeColors.dark,
    tint: themeColors.dark.accent,
    icon: themeColors.dark.textSecondary,
    tabIconSelected: themeColors.dark.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
