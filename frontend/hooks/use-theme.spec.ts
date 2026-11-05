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
  setItem: (key: string, value: string) => mockSetItem(key, value),
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
const mockSetItem = jest.fn<Promise<void>, [key: string, value: string]>();
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
  mockSetItem.mockReset();
  mockSetItem.mockImplementation(async (key, value) => {
    if (key.endsWith('.theme')) mockStoredTheme = value;
  });
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

  it('ignores rapid selections during a save and accepts a new choice after completion', async () => {
    await renderProbe();
    let finishFirst = () => {};
    mockSetItem.mockImplementationOnce(
      (_key, value) =>
        new Promise<void>((resolve) => {
          finishFirst = () => {
            mockStoredTheme = value;
            resolve();
          };
        }),
    );
    const writes: Promise<void>[] = [];
    await act(async () => {
      writes.push(preferences.setThemePreference('dark'));
      writes.push(preferences.setThemePreference('light'));
      writes.push(preferences.setThemePreference('system'));
    });
    expect(mockSetItem.mock.calls).toEqual([
      ['readovo.preferences.theme', 'dark'],
    ]);
    expect(preferences.isSavingThemePreference).toBe(true);
    expect(preferences.themePreference).toBe('system');
    await act(async () => {
      finishFirst();
      await Promise.all(writes);
    });
    expect(mockSetItem).toHaveBeenCalledTimes(1);
    expect(preferences.themePreference).toBe('dark');
    expect(mockStoredTheme).toBe('dark');
    expect(preferences.isSavingThemePreference).toBe(false);
    await act(async () => preferences.setThemePreference('system'));
    expect(preferences.themePreference).toBe('system');
    expect(mockStoredTheme).toBe('system');
    expect(preferences.isSavingThemePreference).toBe(false);
  });

  it('keeps the last persisted choice on failure and allows later writes', async () => {
    mockStoredTheme = 'light';
    mockSystemScheme = 'dark';
    await renderProbe();
    const failure = new Error('Storage unavailable');
    mockSetItem.mockRejectedValueOnce(failure);
    await act(async () => {
      await expect(preferences.setThemePreference('dark')).rejects.toBe(
        failure,
      );
    });
    expect(preferences.themePreference).toBe('light');
    expect(current.theme).toBe('light');
    expect(mockStoredTheme).toBe('light');
    expect(preferences.isSavingThemePreference).toBe(false);
    await act(async () => preferences.setThemePreference('system'));
    expect(preferences.themePreference).toBe('system');
    expect(current.theme).toBe('dark');
    expect(mockStoredTheme).toBe('system');
  });

  it('ignores competing selections even when the active save fails', async () => {
    await renderProbe();
    mockSetItem.mockRejectedValueOnce(new Error('First save failed'));
    await act(async () => {
      const earlier = preferences
        .setThemePreference('dark')
        .catch(() => undefined);
      const latest = preferences.setThemePreference('light');
      await Promise.all([earlier, latest]);
    });
    expect(mockSetItem).toHaveBeenCalledTimes(1);
    expect(preferences.themePreference).toBe('system');
    expect(mockStoredTheme).toBe(null);
    expect(preferences.isSavingThemePreference).toBe(false);
  });

  it('hydrates a successfully saved selection after remounting', async () => {
    await renderProbe();
    await act(async () => preferences.setThemePreference('dark'));
    await act(async () => renderer.unmount());
    renderer = createRoot();
    mockSystemScheme = 'light';
    await renderProbe();
    expect(current.theme).toBe('dark');
    expect(preferences.themePreference).toBe('dark');
  });

  it.each(['light', 'dark'] as const)(
    'aligns navigation with %s application roles',
    (theme) => {
      expect(navigationThemes[theme].colors).toMatchObject({
        background: themeColors[theme].background,
        card: themeColors[theme].background,
        text: themeColors[theme].text,
        primary: themeColors[theme].interactive,
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
      color: '#e6e8eb',
      borderColor: '#687076',
    });
    await act(async () => input.onFocus({}));
    input = mockInput.mock.calls.at(-1)?.[0];
    expect(resolveStyle(input.style)).toMatchObject({
      borderColor: '#8db7ff',
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
      color: '#151718',
    });
    await act(async () => preferences.setThemePreference('dark'));
    expect(resolveStyle(mockInput.mock.calls.at(-1)?.[0].style)).toMatchObject({
      color: '#e6e8eb',
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
