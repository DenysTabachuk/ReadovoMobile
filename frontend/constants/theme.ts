import { Platform } from 'react-native';
import { palette } from './palette';
import { withOpacity } from '@/utils/withOpacity';

export type ThemeColors = Record<keyof typeof lightColors, string>;
export type Theme = 'light' | 'dark';

// Shared UI roles resolve appearance here; components never define a second theme.
const lightColors = {
  // Screen canvas; surface is for cards, fields and panels placed on that canvas.
  background: palette.white,
  surface: palette.white,
  surfaceMuted: palette.gray100,
  text: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray600,
  primary: palette.cyan600,
  onPrimary: palette.white,
  // Active controls, caret/selection and navigation highlights.
  interactive: palette.cyan600,
  link: palette.cyan600,
  // Visual emphasis shared by badges, highlighted panels and accent actions.
  accentSolid: palette.purple600,
  accentSurface: palette.purple100,
  accentBorder: palette.purple200,
  onAccentSurface: palette.purple800,
  border: palette.gray300,
  borderSubtle: palette.gray200,
  borderStrong: palette.gray400,
  inputBorder: palette.gray400,
  placeholder: palette.gray600,
  focus: palette.blue500,
  selection: palette.cyan100,
  onSelection: palette.cyan700,
  selectionBorder: palette.cyan600,
  success: palette.green700,
  successSurface: palette.green100,
  successBorder: palette.green200,
  successSolid: palette.green700,
  onSuccessSolid: palette.white,
  danger: palette.red700,
  dangerSurface: palette.red100,
  dangerBorder: palette.red200,
  dangerSolid: palette.red500,
  onDangerSolid: palette.white,
  info: palette.blue700,
  infoSurface: palette.blue100,
  infoBorder: palette.blue300,
  infoSolid: palette.blue600,
  onInfoSolid: palette.white,
  warning: palette.yellow800,
  warningSurface: palette.yellow100,
  warningBorder: palette.yellow300,
  warningSolid: palette.yellow500,
  onWarningSolid: palette.gray900,
  highlight: palette.yellow500,
  onHighlight: palette.gray900,
  backdrop: withOpacity(palette.black, 0.35),
  overlayControlSurface: withOpacity(palette.white, 0.82),
  textHighlight: withOpacity(palette.yellow500, 0.22),
};

export const themeColors = {
  light: lightColors,
  dark: {
    background: palette.gray900,
    surface: palette.gray800,
    surfaceMuted: palette.gray900,
    text: palette.gray200,
    textSecondary: palette.gray400,
    textMuted: palette.gray400,
    primary: palette.cyan600,
    onPrimary: palette.white,
    interactive: palette.cyan300,
    link: palette.cyan300,
    accentSolid: palette.purple500,
    accentSurface: palette.purple900,
    accentBorder: palette.purple700,
    onAccentSurface: palette.purple200,
    border: palette.gray700,
    borderSubtle: palette.gray800,
    borderStrong: palette.gray600,
    inputBorder: palette.gray600,
    placeholder: palette.gray400,
    focus: palette.blue400,
    selection: palette.cyan900,
    onSelection: palette.cyan300,
    selectionBorder: palette.cyan300,
    success: palette.green300,
    successSurface: palette.green900,
    successBorder: palette.green600,
    successSolid: palette.green700,
    onSuccessSolid: palette.white,
    danger: palette.red300,
    dangerSurface: palette.red900,
    dangerBorder: palette.red500,
    dangerSolid: palette.red500,
    onDangerSolid: palette.white,
    info: palette.blue300,
    infoSurface: palette.blue900,
    infoBorder: palette.blue600,
    infoSolid: palette.blue600,
    onInfoSolid: palette.white,
    warning: palette.yellow300,
    warningSurface: palette.yellow900,
    warningBorder: palette.yellow700,
    warningSolid: palette.yellow500,
    onWarningSolid: palette.gray900,
    highlight: palette.yellow500,
    onHighlight: palette.gray900,
    backdrop: withOpacity(palette.black, 0.35),
    overlayControlSurface: withOpacity(palette.black, 0.48),
    textHighlight: withOpacity(palette.yellow500, 0.22),
  },
} satisfies Record<Theme, ThemeColors>;

// Temporary compatibility API; removed in stage 3 after the consumer audit.
export const Colors = {
  light: {
    ...themeColors.light,
    tint: themeColors.light.interactive,
    icon: themeColors.light.textSecondary,
    tabIconDefault: themeColors.light.textSecondary,
    tabIconSelected: themeColors.light.interactive,
  },
  dark: {
    ...themeColors.dark,
    tint: themeColors.dark.interactive,
    icon: themeColors.dark.textSecondary,
    tabIconDefault: themeColors.dark.textSecondary,
    tabIconSelected: themeColors.dark.interactive,
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
