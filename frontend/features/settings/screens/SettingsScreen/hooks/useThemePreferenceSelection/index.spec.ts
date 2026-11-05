import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { useThemePreferenceSelection } from '.';
import type { ThemePreference } from '@/providers/preferencesProvider';

jest.mock('@/providers/preferencesProvider', () => ({
  usePreferences: () => ({
    themePreference: 'system',
    isSavingThemePreference: false,
    setThemePreference: mockSave,
  }),
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockSave = jest.fn<Promise<void>, [preference: ThemePreference]>();
const mockBanner = jest.fn();
let root: Root;
let controls: ReturnType<typeof useThemePreferenceSelection>;
function Probe() {
  controls = useThemePreferenceSelection();
  return null;
}
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(async () => {
  mockSave.mockReset();
  mockBanner.mockClear();
  root = createRoot();
  await act(async () => root.render(createElement(Probe)));
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it('reports a save error through localized feedback', async () => {
  mockSave.mockRejectedValueOnce(new Error('Disk full'));
  await act(async () => controls.selectTheme('dark'));
  expect(mockSave).toHaveBeenCalledWith('dark');
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'settings.theme.saveError',
    variant: 'error',
  });
});
it('saves a selection without showing an error on success', async () => {
  mockSave.mockResolvedValueOnce(undefined);
  await act(async () => controls.selectTheme('light'));
  expect(mockSave).toHaveBeenCalledWith('light');
  expect(mockBanner).not.toHaveBeenCalled();
});
it('drops save feedback after the settings screen unmounts', async () => {
  let failSave: (error: Error) => void = () => {};
  mockSave.mockImplementationOnce(
    () =>
      new Promise<void>((_resolve, reject) => {
        failSave = reject;
      }),
  );
  await act(async () => controls.selectTheme('dark'));
  await act(async () => root.unmount());
  await act(async () => failSave(new Error('Late failure')));
  expect(mockBanner).not.toHaveBeenCalled();
});
