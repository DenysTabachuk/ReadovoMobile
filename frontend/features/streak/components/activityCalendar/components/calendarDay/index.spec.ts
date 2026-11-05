import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import { themeColors, type Theme } from '@/constants/theme';
import { CalendarDay } from '.';

type CapturedPressableProps = Omit<PressableProps, 'onPress'> & {
  onPress?: () => void;
};

jest.mock('react-native', () => ({
  Platform: { select: () => ({}) },
  StyleSheet: { create: (styles: unknown) => styles },
  View: (props: ViewProps) => {
    mockViews.push(props);
    return createElement('view', props);
  },
  Pressable: (props: CapturedPressableProps) => {
    mockPressable = props;
    return createElement('button', props);
  },
}));
jest.mock('@/components/themedText', () => ({
  ThemedText: (props: TextProps) => {
    mockText = props;
    return null;
  },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { color: string; name: string }) => {
    mockIcon = props;
    return null;
  },
}));
jest.mock('@/hooks/use-theme', () => ({
  // Deliberately distinguish the primary foreground from other solid foregrounds.
  useTheme: () => ({
    colors: { ...themeColors[mockTheme], onPrimary: '#123456' },
  }),
}));

let mockTheme: Theme = 'light';
let mockText: TextProps;
let mockIcon: { color: string; name: string } | undefined;
let mockPressable: CapturedPressableProps | undefined;
const mockViews: ViewProps[] = [];
let root: Root;

function resolveStyle(style: unknown): Record<string, unknown> {
  if (typeof style === 'function')
    return resolveStyle(style({ pressed: false, hovered: false }));
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
  mockIcon = undefined;
  mockPressable = undefined;
  mockViews.length = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
});

describe.each(['light', 'dark'] as const)('%s calendar appearance', (theme) => {
  it.each([
    ['completed', '#6f3ff0', '#7d4ef6', '#ffffff', '#ffffff', 'checkmark'],
    [
      'today_completed',
      '#6f3ff0',
      '#7d4ef6',
      '#ffffff',
      '#ffffff',
      'checkmark',
    ],
    ['missed', '#d93025', '#d93025', '#ffffff', '#ffffff', 'close'],
    ['frozen', '#2d6bc9', '#2d6bc9', '#ffffff', '#ffffff', 'snow'],
    ['restored', '#f2c94c', '#f2c94c', '#151718', '#151718', 'refresh'],
    ['today_pending', 'transparent', 'transparent', '#151718', '#e6e8eb', null],
    ['future', 'transparent', 'transparent', '#687076', '#9ba1a6', null],
    ['neutral', 'transparent', 'transparent', '#151718', '#e6e8eb', null],
  ] as const)(
    'renders %s with its background and foreground',
    async (status, lightFill, darkFill, lightText, darkText, icon) => {
      mockTheme = theme;
      const day = { date: '2026-11-05', dayOfMonth: 5, status };
      const requestFreeze = jest.fn();
      await act(async () =>
        root.render(
          createElement(CalendarDay, {
            day,
            onRequestFreezeDay: requestFreeze,
          }),
        ),
      );
      const foreground = theme === 'light' ? lightText : darkText;
      expect(resolveStyle(mockText.style).color).toBe(foreground);
      const cellStyle = mockPressable?.style ?? mockViews[0].style;
      expect(resolveStyle(cellStyle).backgroundColor).toBe(
        theme === 'light' ? lightFill : darkFill,
      );
      if (status === 'today_pending') {
        expect(resolveStyle(cellStyle)).toMatchObject({
          borderColor: theme === 'light' ? '#0a7ea4' : '#67c6e3',
          borderWidth: 2,
        });
      }
      if (icon) {
        expect(mockIcon).toMatchObject({ name: icon, color: foreground });
      } else {
        expect(mockIcon).toBeUndefined();
      }
      if (status === 'missed') {
        mockPressable?.onPress?.();
        expect(requestFreeze).toHaveBeenCalledWith(day);
      } else {
        expect(mockPressable).toBeUndefined();
      }
    },
  );
});
