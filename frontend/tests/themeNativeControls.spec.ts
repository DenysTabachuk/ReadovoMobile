import {
  act,
  createElement,
  Fragment,
  type ComponentProps,
  type PropsWithChildren,
} from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { TextInputProps } from 'react-native';
import { themeColors, type Theme } from '@/constants/theme';
import { VerificationCodeModal } from '@/features/auth/components/verificationCodeModal';
import { ArticlesToolbar } from '@/features/articles/screens/ArticlesScreen/components/articlesToolbar';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: () => ({}) },
  useColorScheme: () => (mockTheme === 'light' ? 'dark' : 'light'),
  StyleSheet: { create: (styles: unknown) => styles },
  View: 'view',
  Pressable: 'button',
  ActivityIndicator: () => null,
  TextInput: (props: TextInputProps) => {
    mockInputs.push(props);
    return null;
  },
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    colors: themeColors[mockTheme],
    isDark: mockTheme === 'dark',
  }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'animated-view' },
  Easing: { cubic: jest.fn(), inOut: jest.fn() },
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: (worklet: () => unknown) => worklet(),
  withTiming: (value: number) => value,
}));
jest.mock('@/components/modalSheet', () => ({
  ModalSheet: ({ children }: PropsWithChildren) => children,
}));
jest.mock('@/components/button', () => ({ Button: () => null }));
jest.mock('@/components/themedText', () => ({ ThemedText: () => null }));
jest.mock(
  '@/features/articles/screens/ArticlesScreen/components/articlesToolbar/components/articleContentFilters',
  () => ({ ArticleContentFilters: () => null }),
);
jest.mock(
  '@/features/articles/screens/ArticlesScreen/components/articlesToolbar/components/articleQuickFilters',
  () => ({ ArticleQuickFilters: () => null }),
);
jest.mock(
  '@/features/articles/screens/ArticlesScreen/components/articlesToolbar/components/personalArticlesFilter',
  () => ({ PersonalArticlesFilter: () => null }),
);
jest.mock(
  '@/features/articles/screens/ArticlesScreen/components/articlesToolbar/components/recommendedArticlesFilter',
  () => ({ RecommendedArticlesFilter: () => null }),
);

let mockTheme: Theme = 'light';
const mockInputs: TextInputProps[] = [];
let root: Root;

const verificationProps: ComponentProps<typeof VerificationCodeModal> = {
  code: '',
  description: 'Description',
  isBusy: false,
  isOpen: true,
  isResending: false,
  isVerifying: false,
  onChangeCode: jest.fn(),
  onClose: jest.fn(),
  onResend: jest.fn(),
  onVerify: jest.fn(),
  resendCountdownLabel: String,
  resendButtonLabel: 'Resend',
  resendingLabel: 'Resending',
  title: 'Verify',
  verificationButtonLabel: 'Verify',
  verificationCodeLabel: 'Code',
  verificationCodePlaceholder: 'Enter code',
  verifyingLabel: 'Verifying',
};
const toolbarProps: ComponentProps<typeof ArticlesToolbar> = {
  categoryFilter: 'all',
  personalFilter: null,
  isRefreshingResults: false,
  isFiltersCollapsed: true,
  isSearchActive: false,
  preferImagesFirst: false,
  readyAdaptationEnabled: false,
  readyLevelFilter: 'all',
  readySummaryEnabled: false,
  recommendedArticles: false,
  recentArticlesCount: 0,
  resultCount: 0,
  savedArticlesCount: 0,
  searchValue: '',
  sortByFilter: 'default',
  onChangeCategoryFilter: jest.fn(),
  onChangePreferImagesFirst: jest.fn(),
  onChangeReadyLevelFilter: jest.fn(),
  onChangeReadyAdaptationEnabled: jest.fn(),
  onChangeReadySummaryEnabled: jest.fn(),
  onChangeRecommendedArticles: jest.fn(),
  onChangeSearchValue: jest.fn(),
  onChangeSortByFilter: jest.fn(),
  onClearFilters: jest.fn(),
  onChangePersonalFilter: jest.fn(),
  onToggleFiltersCollapsed: jest.fn(),
};

function Controls() {
  return createElement(
    Fragment,
    null,
    createElement(VerificationCodeModal, verificationProps),
    createElement(ArticlesToolbar, toolbarProps),
  );
}

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  root = createRoot();
  mockInputs.length = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it.each(['light', 'dark'] as const)(
  'passes resolved %s appearance to verification/search keyboards despite opposite OS appearance',
  async (theme) => {
    mockTheme = theme;
    await act(async () => root.render(createElement(Controls)));
    expect(mockInputs).toHaveLength(2);
    for (const input of mockInputs) {
      expect(input.keyboardAppearance).toBe(theme);
      expect(input.selectionColor).toBe(
        theme === 'light' ? '#0a7ea4' : '#67c6e3',
      );
    }
    mockInputs.length = 0;
    mockTheme = theme === 'light' ? 'dark' : 'light';
    await act(async () => root.render(createElement(Controls)));
    expect(mockInputs).toHaveLength(2);
    expect(
      mockInputs.every((input) => input.keyboardAppearance === mockTheme),
    ).toBe(true);
  },
);
