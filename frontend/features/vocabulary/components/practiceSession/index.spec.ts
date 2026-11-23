import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import type { Button } from '@/components/button';
import { api } from '@/features/auth';
import { usePrefetchLearningMedia } from '@/features/learningMedia';
import {
  createVocabularyPractice,
  createVocabularyFeedback,
} from '../../testing/practiceFixtures';
import { PracticeSession } from '.';

jest.mock('@/features/auth', () => ({
  api: { post: jest.fn() },
  useAuthenticatedUser: () => ({ id: 'test-owner' }),
}));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => createElement('icon', { name }),
}));
jest.mock('react-native', () => ({
  View: (props: ViewProps) => createElement('view', props),
  Pressable: (props: PressableProps) => createElement('button', props),
  StyleSheet: { create: (styles: object) => styles },
  useWindowDimensions: () => ({ fontScale: 1 }),
}));
jest.mock('react-native-reanimated', () => {
  const transition = {
    delay: () => ({ duration: () => ({ reduceMotion: () => ({}) }) }),
  };
  return {
    __esModule: true,
    default: { View: (props: ViewProps) => createElement('view', props) },
    FadeIn: transition,
    ReduceMotion: { System: 'system' },
  };
});
jest.mock('@/components/themedText', () => ({
  ThemedText: ({ children }: Pick<TextProps, 'children'>) =>
    createElement('text', null, children),
}));
jest.mock('@/components/button', () => ({
  Button: (props: ComponentProps<typeof Button>) =>
    createElement(
      'button',
      { ...props, accessibilityLabel: props.children },
      createElement('text', null, props.children),
    ),
}));
jest.mock('@/components/scrollableScreen', () => ({
  ScrollableScreen: (props: ViewProps) => createElement('view', props),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ colors: { textSecondary: '#9ba1a6' } }),
}));
jest.mock('expo-image', () => ({ Image: () => createElement('image') }));
jest.mock('@/features/learningMedia', () => ({
  LearningArtwork: ({ imageUrl }: { imageUrl: string | null }) =>
    createElement('image', { imageUrl }),
  usePrefetchLearningMedia: jest.fn(),
}));
jest.mock(
  '../picturePractice/components/pictureOption/components/SpoilerPlaceholder',
  () => ({
    SpoilerPlaceholder: ({ revealed }: { revealed: boolean }) =>
      createElement('spoiler', { revealed }),
  }),
);
jest.mock('../../hooks/useVocabularySpeech', () => ({
  useVocabularySpeech: () => ({
    speakingText: null,
    hasSpeechError: false,
    pronounce: jest.fn(),
  }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: 'uk' },
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

let root: Root;
let client: QueryClient;
beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
beforeEach(() => {
  root = createRoot({ textComponentTypes: ['text'] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  jest.resetAllMocks();
});

async function render(Screen: () => ReturnType<typeof createElement>) {
  await act(async () => {
    root.render(
      createElement(QueryClientProvider, { client }, createElement(Screen)),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function button(label: string) {
  const target = root.container.queryAll(
    (node) => node.type === 'button' && node.props.accessibilityLabel === label,
  )[0];
  if (!target) throw new Error(`Missing button ${label}`);
  return target;
}

async function press(label: string) {
  const target = button(label);
  if (target.props.disabled) throw new Error(`Disabled button ${label}`);
  const onPress: unknown = target.props.onPress;
  if (typeof onPress !== 'function') throw new Error('Missing press handler');
  await act(async () => {
    onPress();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function text() {
  return JSON.stringify(root.container.toJSON());
}

const continueToReading = jest.fn();

async function openPractice() {
  await render(() =>
    createElement(PracticeSession, {
      lessonSlug: 'oktoberfest',
      level: 'A1',
      title: 'Oktoberfest',
      questions: createVocabularyPractice().questions,
      onBackToLesson: jest.fn(),
      onContinue: continueToReading,
    }),
  );
}

it('loads API questions, submits once during duplicate taps, and locks server-checked choices', async () => {
  await openPractice();
  expect(usePrefetchLearningMedia).toHaveBeenLastCalledWith(
    [
      '/learning/media?key=vocabulary%2Fsample%2Fword-1%2Fv1.png',
      '/learning/media?key=vocabulary%2Fsample%2Fword-2%2Fv1.png',
      '/learning/media?key=vocabulary%2Fsample%2Fword-3%2Fv1.png',
    ],
    true,
  );
  expect(text()).toContain('Sample word 1');
  expect(
    root.container
      .queryAll((node) => node.type === 'image')
      .map((image) => image.props.imageUrl),
  ).toEqual([
    '/learning/media?key=vocabulary%2Fsample%2Fword-1%2Fv1.png',
    '/learning/media?key=vocabulary%2Fsample%2Fword-2%2Fv1.png',
    '/learning/media?key=vocabulary%2Fsample%2Fword-3%2Fv1.png',
  ]);
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'text' &&
        typeof node.props.children === 'string' &&
        node.props.children.startsWith('vocabulary.practice.pictureNumber'),
    ),
  ).toHaveLength(0);
  expect(
    root.container
      .queryAll((node) => node.type === 'spoiler')
      .map((node) => node.props.revealed),
  ).toEqual([false, false, false]);
  expect(text()).not.toContain('Sample word 2');
  expect(button('vocabulary.practice.check').props.disabled).toBe(true);
  await press('vocabulary.practice.pictureNumber {"number":2}');
  expect(text()).not.toContain('close-circle');
  jest
    .mocked(api.post)
    .mockResolvedValue({ data: createVocabularyFeedback(0, 'word-2') });
  const action = button('vocabulary.practice.check').props.onPress;
  if (typeof action !== 'function') throw new Error('Missing submit');
  await act(async () => {
    action();
    action();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith(
    '/learning/lessons/oktoberfest/vocabulary/exercises/exercise-1/check',
    { optionId: 'word-2' },
    { params: { level: 'A1' } },
  );
  expect(text()).toContain('vocabulary.practice.incorrect');
  expect(text()).toContain('Sample word 2');
  expect(
    root.container
      .queryAll((node) => node.type === 'spoiler')
      .map((node) => node.props.revealed),
  ).toEqual([true, true, true]);
  expect(text()).toContain('checkmark-circle');
  expect(text()).toContain('close-circle');
  expect(button('Sample word 2').props.disabled).toBe(true);
  expect(text()).toContain('Translation 1');
});

it('keeps a failed answer unchecked and allows retrying the same selection', async () => {
  await openPractice();
  await press('vocabulary.practice.pictureNumber {"number":1}');
  jest.mocked(api.post).mockRejectedValue(new Error('private diagnostics'));
  await press('vocabulary.practice.check');
  expect(text()).toContain('vocabulary.practice.checkError');
  expect(text()).not.toContain('private diagnostics');
  expect(
    button('vocabulary.practice.pictureNumber {"number":1}').props.disabled,
  ).toBe(false);
  jest
    .mocked(api.post)
    .mockResolvedValue({ data: createVocabularyFeedback(0, 'word-1') });
  await press('vocabulary.practice.check');
  expect(text()).toContain('vocabulary.practice.correct');
});

it('plays listening prompts without showing the English answer, then reveals sentence feedback and a server-scored result', async () => {
  await openPractice();
  await press('vocabulary.practice.pictureNumber {"number":1}');
  jest
    .mocked(api.post)
    .mockResolvedValue({ data: createVocabularyFeedback(0, 'word-1') });
  await press('vocabulary.practice.check');
  await press('vocabulary.cards.next');
  expect(text()).toContain('vocabulary.audio.listenAgain');
  expect(text()).not.toContain('Sample word 2');
  await press('vocabulary.practice.pictureNumber {"number":1}');
  jest
    .mocked(api.post)
    .mockResolvedValue({ data: createVocabularyFeedback(1, 'word-1') });
  await press('vocabulary.practice.check');
  await press('vocabulary.cards.next');
  expect(text()).toContain('___');
  expect(text()).not.toContain('Translated complete sentence');
  await press('sample word 3');
  jest
    .mocked(api.post)
    .mockResolvedValue({ data: createVocabularyFeedback(2, 'word-3') });
  await press('vocabulary.practice.check');
  expect(text()).not.toContain('___');
  expect(text()).toContain('Translated complete sentence');
  expect(text()).toContain('checkmark-circle');
  expect(text()).not.toContain('close-circle');
  expect(button('sample word 3').props.disabled).toBe(true);
  await press('vocabulary.practice.showResult');
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'text' &&
        node.props.children ===
          'vocabulary.practice.score {"correct":2,"total":3}',
    ),
  ).toHaveLength(1);
  expect(text()).toContain('Translation 2');
  await press('vocabulary.practice.nextStage');
  expect(continueToReading).toHaveBeenCalledTimes(1);
  await press('vocabulary.practice.tryAgain');
  expect(text()).toContain('Sample word 1');
  expect(button('vocabulary.practice.check').props.disabled).toBe(true);
});
