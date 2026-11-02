import { createElement, type ReactNode, useState } from 'react';

import type { DictionaryTest } from '../../api/types';
import DictionaryTestScreen from '.';

type GenerationCallbacks = {
  onSuccess?: (test: DictionaryTest) => void;
};
type ButtonProps = {
  children?: ReactNode;
  onPress?: () => void;
};
type ServerRenderer = {
  renderToStaticMarkup: (element: ReactNode) => string;
};

// react-dom is installed without its optional type package. Describe only the
// existing server-renderer API consumed here, keeping this boundary test-local.
const { renderToStaticMarkup } =
  jest.requireActual<ServerRenderer>('react-dom/server');

const GENERATED_TEST: DictionaryTest = {
  sessionId: 'retry-session',
  questions: [
    {
      wordId: 'word-cat',
      word: 'cat',
      prompt: 'Choose the translation',
      format: 'translation',
      options: [{ id: 'option-cat', text: 'kit', translation: 'kit' }],
    },
  ],
};
const mockSetTest = jest.fn();
const mockGenerateTest = jest.fn(
  (_variables?: void, callbacks?: GenerationCallbacks) => {
    callbacks?.onSuccess?.(GENERATED_TEST);
  },
);
let mockRetry: (() => void) | undefined;

// Render the actual screen with React's server renderer. Capture its first state
// setter to verify that the error-state button stores a successful retry result.
jest.mock('react', () => {
  const actual = jest.requireActual<typeof import('react')>('react');
  return { ...actual, useState: jest.fn(actual.useState) };
});
jest.mock('../../api', () => ({
  useGenerateDictionaryTestMutation: () => ({
    error: new Error('Generation failed'),
    isPending: false,
    mutate: mockGenerateTest,
  }),
}));
jest.mock('@react-navigation/native', () => ({
  usePreventRemove: jest.fn(),
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn() }),
  useNavigation: () => ({ dispatch: jest.fn() }),
}));
jest.mock('react-native', () => ({
  View: 'div',
  ActivityIndicator: 'progress',
}));
jest.mock('@/constants/theme', () => ({
  Colors: { light: { tint: '#000000' } },
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/components/button', () => ({
  Button: ({ children, onPress }: ButtonProps) => {
    if (children === 'dictionary.retry') mockRetry = onPress;
    return null;
  },
}));
jest.mock('@/components/screenContainer', () => ({ ScreenContainer: 'main' }));
jest.mock('@/components/themedText', () => ({ ThemedText: 'span' }));
jest.mock('@/components/modalSheet', () => ({ ModalSheet: () => null }));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: jest.fn() }),
}));
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));
jest.mock('@/features/quiz', () => ({
  useCompleteQuizMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useSubmitQuizAnswerMutation: () => ({ mutate: jest.fn() }),
  useQuizCompletionFeedback: () => ({}),
  QuizRunner: () => null,
  QuizResult: () => null,
}));
jest.mock('./styles', () => ({ styles: {} }));

it('stores the generated test when the error-state Retry button succeeds', () => {
  jest.mocked(useState).mockReturnValueOnce([undefined, mockSetTest]);
  renderToStaticMarkup(createElement(DictionaryTestScreen));

  const retry = mockRetry;
  if (!retry) throw new Error('The error state must expose a Retry button.');
  retry();

  expect(mockGenerateTest).toHaveBeenCalledTimes(1);
  expect(mockSetTest).toHaveBeenCalledWith(GENERATED_TEST);
});
