import { act, createElement } from 'react';
import type { ViewProps } from 'react-native';
import { createRoot, type Root } from 'test-renderer';
import { useTheme } from './use-theme';
import {
  PreferencesProvider,
  usePreferences,
} from '@/providers/preferencesProvider';
import { themeColors } from '@/constants/theme';
import { navigationThemes } from '@/constants/navigationTheme';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { FormTextInput } from '@/components/formTextInput';

jest.mock('react-native', () => ({
  useColorScheme: () => mockSystemScheme,
  Platform: { select: () => ({}) },
  StyleSheet: { create: (styles: unknown) => styles },
  Text: (props: unknown) => {
    mockText(props);
    return null;
  },
  View: (props: ViewProps) => {
    mockView(props);
    return createElement('view', props);
  },
  TextInput: (props: unknown) => {
    mockInput(props);
    return null;
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (key: string) =>
    key.endsWith('.theme') ? mockStoredTheme : null,
  setItem: async () => undefined,
}));
jest.mock('@/localization', () => ({ changeLanguage: async () => undefined }));
jest.mock('@react-navigation/native', () => ({
  DefaultTheme: { dark: false, fonts: { regular: 'light-font' }, colors: {} },
  DarkTheme: { dark: true, fonts: { regular: 'dark-font' }, colors: {} },
}));

let mockSystemScheme: string | null = 'light';
let mockStoredTheme: string | null = null;
const mockText = jest.fn();
const mockView = jest.fn();
const mockInput = jest.fn();
let renderer: Root;
let current: ReturnType<typeof useTheme>;
let preferences: ReturnType<typeof usePreferences>;

// Resolve composed style props at the mocked native boundary, without depending
// on how individual rules are split between StyleSheet entries.
function resolveStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(resolveStyle));
  }
  if (typeof style === 'object' && style !== null) {
    return { ...style };
  }
  return {};
}

function Probe() {
  current = useTheme();
  preferences = usePreferences();
  return null;
}

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  mockSystemScheme = 'light';
  mockStoredTheme = null;
  jest.clearAllMocks();
  renderer = createRoot();
});
afterEach(async () => {
  await act(async () => renderer.unmount());
});

async function renderProbe() {
  await act(async () =>
    renderer.render(
      createElement(PreferencesProvider, null, createElement(Probe)),
    ),
  );
}

describe('resolved application theme', () => {
  it('hydrates an explicit preference and ignores opposite OS changes', async () => {
    mockStoredTheme = 'dark';
    await renderProbe();
    expect(preferences.isLoadingPreferences).toBe(false);
    expect(current).toEqual({
      theme: 'dark',
      colors: themeColors.dark,
      isDark: true,
    });
    mockSystemScheme = 'dark';
    await renderProbe();
    mockSystemScheme = 'light';
    await renderProbe();
    expect(current.theme).toBe('dark');
  });

  it('updates mounted consumers, supports returning to system and falls back to light', async () => {
    mockSystemScheme = 'dark';
    await renderProbe();
    expect(current.theme).toBe('dark');
    await act(async () => preferences.setThemePreference('light'));
    expect(current.theme).toBe('light');
    await act(async () => preferences.setThemePreference('system'));
    expect(current.theme).toBe('dark');
    mockSystemScheme = null;
    await renderProbe();
    expect(current.theme).toBe('light');
    mockSystemScheme = 'dark';
    await renderProbe();
    expect(current.theme).toBe('dark');
  });

  it.each(['light', 'dark'] as const)(
    'aligns navigation with %s application roles',
    (theme) => {
      expect(navigationThemes[theme].colors).toMatchObject({
        background: themeColors[theme].background,
        card: themeColors[theme].background,
        text: themeColors[theme].text,
        primary: themeColors[theme].accent,
        border: themeColors[theme].borderSubtle,
      });
      expect(navigationThemes[theme].dark).toBe(theme === 'dark');
      expect(navigationThemes[theme].fonts).toBeDefined();
    },
  );

  it('uses focus and error roles with error taking precedence', async () => {
    mockStoredTheme = 'dark';
    await act(async () =>
      renderer.render(
        createElement(
          PreferencesProvider,
          null,
          createElement(FormTextInput, { label: 'Email' }),
        ),
      ),
    );
    let input = mockInput.mock.calls.at(-1)?.[0];
    expect(resolveStyle(input.style)).toMatchObject({
      color: '#ECEDEE',
      borderColor: '#9f9f9f',
    });
    await act(async () => input.onFocus({}));
    input = mockInput.mock.calls.at(-1)?.[0];
    expect(resolveStyle(input.style)).toMatchObject({
      borderColor: '#4257ff',
      borderWidth: 2,
    });
    await act(async () =>
      renderer.render(
        createElement(
          PreferencesProvider,
          null,
          createElement(FormTextInput, {
            label: 'Email',
            hasError: true,
            errorText: 'Invalid email',
          }),
        ),
      ),
    );
    input = mockInput.mock.calls.at(-1)?.[0];
    expect(resolveStyle(input.style)).toMatchObject({
      borderColor: '#ff8076',
      borderWidth: 2,
    });
    expect(
      mockText.mock.calls.some(
        ([props]) => resolveStyle(props.style).color === '#ff8076',
      ),
    ).toBe(true);
  });

  it('updates mounted control styles when the resolved palette changes', async () => {
    await act(async () =>
      renderer.render(
        createElement(
          PreferencesProvider,
          null,
          createElement(Probe),
          createElement(ThemedText, { type: 'link', testID: 'theme-link' }),
          createElement(ThemedView, { testID: 'theme-surface' }),
          createElement(FormTextInput, { label: 'Email' }),
        ),
      ),
    );
    expect(resolveStyle(mockInput.mock.calls.at(-1)?.[0].style)).toMatchObject({
      color: '#11181C',
    });
    await act(async () => preferences.setThemePreference('dark'));
    expect(resolveStyle(mockInput.mock.calls.at(-1)?.[0].style)).toMatchObject({
      color: '#ECEDEE',
    });
    const link = mockText.mock.calls
      .filter(([props]) => props.testID === 'theme-link')
      .at(-1)?.[0];
    const surface = mockView.mock.calls
      .filter(([props]) => props.testID === 'theme-surface')
      .at(-1)?.[0];
    expect(resolveStyle(link.style)).toMatchObject({ color: '#67c6e3' });
    expect(resolveStyle(surface.style)).toMatchObject({
      backgroundColor: '#151718',
    });
  });

  it('preserves caller text, view and input style overrides', async () => {
    mockStoredTheme = 'dark';
    await act(async () =>
      renderer.render(
        createElement(
          PreferencesProvider,
          null,
          createElement(ThemedText, {
            type: 'link',
            style: { color: 'caller-text' },
          }),
          createElement(ThemedView, {
            style: { backgroundColor: 'caller-surface' },
          }),
          createElement(FormTextInput, {
            label: 'Email',
            placeholderTextColor: 'caller-placeholder',
            selectionColor: 'caller-selection',
            style: { color: 'caller-input' },
          }),
        ),
      ),
    );
    expect(
      mockView.mock.calls.some(
        ([props]) =>
          resolveStyle(props.style).backgroundColor === 'caller-surface',
      ),
    ).toBe(true);
    const input = mockInput.mock.calls.at(-1)?.[0];
    expect(input).toMatchObject({
      placeholderTextColor: 'caller-placeholder',
      selectionColor: 'caller-selection',
    });
    expect(resolveStyle(input.style)).toMatchObject({ color: 'caller-input' });
    expect(
      mockText.mock.calls.some(
        ([props]) => resolveStyle(props.style).color === 'caller-text',
      ),
    ).toBe(true);
  });
});
