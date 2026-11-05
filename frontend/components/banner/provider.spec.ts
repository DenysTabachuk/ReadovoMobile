import { act, createElement, type PropsWithChildren } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { TextProps } from 'react-native';
import { themeColors, type Theme } from '@/constants/theme';
import { BannerProvider } from './provider';
import { useBanner } from './useBanner';

jest.mock('react-native', () => ({
  Platform: { select: () => ({}) },
  StyleSheet: { create: (styles: unknown) => styles },
  View: 'view',
  Animated: {
    Value: class {
      stopAnimation() {}
      setValue() {}
    },
    parallel: () => ({ start: jest.fn() }),
    timing: jest.fn(),
    spring: jest.fn(),
  },
}));
jest.mock('./banner', () => ({
  Banner: ({ children }: PropsWithChildren) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('../../assets/images/money.png', () => 1);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/components/themedText', () => ({
  ThemedText: (props: TextProps) => {
    mockTexts.push(props);
    return null;
  },
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    colors: { ...themeColors[mockTheme], onPrimary: '#123456' },
  }),
}));

let mockTheme: Theme = 'light';
const mockTexts: TextProps[] = [];
let root: Root;
let controls: ReturnType<typeof useBanner>;
function Probe() {
  controls = useBanner();
  return null;
}
function resolveStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style))
    return Object.assign({}, ...style.map(resolveStyle));
  if (typeof style === 'object' && style !== null) return { ...style };
  return {};
}
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  root = createRoot();
  mockTexts.length = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
});

describe.each(['light', 'dark'] as const)('%s banner content', (theme) => {
  it.each([
    ['success', '#ffffff', '#ffffff'],
    ['error', '#ffffff', '#ffffff'],
    ['info', '#ffffff', '#ffffff'],
    ['reward', '#151718', '#151718'],
    ['streak', '#151718', '#e6e8eb'],
  ] as const)(
    'uses the %s foreground for both title and description',
    async (variant, lightText, darkText) => {
      mockTheme = theme;
      await act(async () =>
        root.render(createElement(BannerProvider, null, createElement(Probe))),
      );
      await act(async () =>
        controls.showBanner({
          variant,
          title: 'Title',
          description: 'Description',
          durationMs: 0,
        }),
      );
      for (const content of ['Title', 'Description']) {
        const text = mockTexts.find((props) => props.children === content);
        expect(text).toBeDefined();
        expect(resolveStyle(text?.style).color).toBe(
          theme === 'light' ? lightText : darkText,
        );
      }
    },
  );
});
