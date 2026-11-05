import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { PressableProps, ViewProps } from 'react-native';
import { themeColors } from '@/constants/theme';
import { SegmentedToggle } from '.';

jest.mock('react-native', () => ({
  Platform: { select: () => ({}) },
  StyleSheet: { create: (styles: unknown) => styles },
  View: (props: ViewProps) => createElement('view', props),
  Pressable: (props: PressableProps) => {
    mockOptions.push(props);
    return null;
  },
}));
jest.mock('@/components/themedText', () => ({ ThemedText: () => null }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    colors: themeColors.light,
    isDark: false,
  }),
}));
const mockOptions: PressableProps[] = [];
let root: Root;
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  root = createRoot();
  mockOptions.length = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
});
it.each(['system', 'light', 'dark'] as const)(
  'exposes %s as the selected radio option',
  async (selectedValue) => {
    await act(async () =>
      root.render(
        createElement(SegmentedToggle, {
          selectedValue,
          options: [
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
          onChange: jest.fn(),
        }),
      ),
    );
    expect(mockOptions.map((props) => props.accessibilityRole)).toEqual([
      'radio',
      'radio',
      'radio',
    ]);
    expect(
      mockOptions.map((props) => props.accessibilityState?.selected),
    ).toEqual([
      selectedValue === 'system',
      selectedValue === 'light',
      selectedValue === 'dark',
    ]);
  },
);

it('disables every option and exposes its disabled state while saving', async () => {
  await act(async () =>
    root.render(
      createElement(SegmentedToggle, {
        disabled: true,
        selectedValue: 'system',
        options: [
          { label: 'System', value: 'system' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
        onChange: jest.fn(),
      }),
    ),
  );
  expect(mockOptions).toHaveLength(3);
  for (const option of mockOptions) {
    expect(option.disabled).toBe(true);
    expect(option.accessibilityState?.disabled).toBe(true);
    expect(option.onPress).toBeUndefined();
  }
});
