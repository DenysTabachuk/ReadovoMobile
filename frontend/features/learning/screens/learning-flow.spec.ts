import {
  act,
  createElement,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRoot, type Root } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePreventRemove } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import type {
  FlatListProps,
  PressableProps,
  TextInputProps,
  TextProps,
  ViewProps,
} from 'react-native';
import type { OptionPickerField } from '@/components/optionPickerField';
import type { ModalSheet } from '@/components/modalSheet';
import type { Button } from '@/components/button';
import { api } from '@/features/auth';
import type { PracticeSession, WordCards } from '@/features/vocabulary';
import type { LearningArtwork } from '../components/LearningArtwork';
import { LearningLevelProvider } from '../providers/learningLevelProvider';
import {
  createCatalogue,
  createLesson,
} from '../testing/learningResponseFixtures';
import LearningScreen from './LearningScreen';
import ThematicLessonScreen from './ThematicLessonScreen';

const mockShowBanner = jest.fn();
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('@/features/auth', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  useAuthenticatedUser: () => ({ id: 'owner' }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('@/providers/preferencesProvider', () => ({
  usePreferences: () => ({ languagePreference: 'en' }),
}));
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { headerRight?: () => ReactNode } }) =>
      options.headerRight?.() ?? null,
  },
  useLocalSearchParams: jest.fn(),
  router: { push: jest.fn() },
}));
jest.mock('@react-navigation/native', () => ({ usePreventRemove: jest.fn() }));
jest.mock('react-native', () => ({
  ActivityIndicator: () => createElement('loader'),
  FlatList: <Item>(props: FlatListProps<Item>) =>
    createElement(
      'list',
      null,
      isValidElement(props.ListHeaderComponent) && props.ListHeaderComponent,
      ...Array.from(props.data ?? [], (item, index) =>
        createElement(
          Fragment,
          { key: props.keyExtractor?.(item, index) ?? index },
          props.renderItem?.({
            item,
            index,
            separators: {
              highlight: () => undefined,
              unhighlight: () => undefined,
              updateProps: () => undefined,
            },
          }),
        ),
      ),
      isValidElement(props.ListFooterComponent) && props.ListFooterComponent,
    ),
  View: (props: ViewProps) => createElement('view', props),
  Pressable: (props: PressableProps) => createElement('button', props),
  TextInput: (props: TextInputProps) => createElement('input', props),
  StyleSheet: { create: (styles: object) => styles },
}));
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
jest.mock('@/components/screenContainer', () => ({
  ScreenContainer: (props: ViewProps) => createElement('view', props),
}));
jest.mock('@/components/fullScreenLoader', () => ({
  FullScreenLoader: () => createElement('loader'),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/features/quiz', () =>
  jest.requireActual<typeof import('../../quiz/hooks/useQuizAttempt')>(
    '../../quiz/hooks/useQuizAttempt',
  ),
);
jest.mock('expo-image', () => ({ Image: () => createElement('image') }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (props: ViewProps) => createElement('view', props),
}));
jest.mock('@/components/imageWithFallback', () => ({
  ImageWithFallback: () => createElement('image'),
}));
jest.mock('../components/LearningArtwork', () => ({
  LearningArtwork: ({
    imageUrl,
    fallback,
  }: ComponentProps<typeof LearningArtwork>) =>
    imageUrl === null && fallback !== undefined
      ? fallback
      : createElement('image', { imageUrl }),
}));
jest.mock('@/components/optionPickerField', () => ({
  OptionPickerField: (props: ComponentProps<typeof OptionPickerField>) =>
    createElement(
      'view',
      null,
      ...props.options.map((option) =>
        createElement('button', {
          key: option.value,
          accessibilityLabel: option.value,
          onPress: () => props.onSelect(option.value),
        }),
      ),
    ),
}));
jest.mock('@/components/modalSheet', () => ({
  ModalSheet: (props: ComponentProps<typeof ModalSheet>) =>
    props.open
      ? createElement('view', null, props.children, props.footer)
      : null,
}));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('@/constants/theme', () => ({ Fonts: { serif: 'serif' } }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/features/vocabulary', () => ({
  WordCards: (props: ComponentProps<typeof WordCards>) =>
    createElement(
      'view',
      null,
      createElement('text', null, props.words.map(({ id }) => id).join(',')),
      createElement('button', {
        accessibilityLabel: 'finish-cards',
        onPress: props.onContinue,
      }),
    ),
  PracticeSession: (props: ComponentProps<typeof PracticeSession>) =>
    createElement('text', null, props.questions.map(({ id }) => id).join(',')),
}));

let root: Root;
let client: QueryClient;
beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
beforeEach(() => {
  root = createRoot({ textComponentTypes: ['text'] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  jest.mocked(api.get).mockImplementation(async (url, config) => {
    if (url === '/learning/catalogue') return { data: createCatalogue() };
    const lesson = createLesson();
    const params: unknown = config?.params;
    if (
      typeof params === 'object' &&
      params !== null &&
      'level' in params &&
      params.level === 'B2'
    )
      return { data: { ...lesson, variant: null } };
    return { data: lesson };
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  jest.resetAllMocks();
});
async function render(Screen: () => ReturnType<typeof createElement>) {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(LearningLevelProvider, null, createElement(Screen)),
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  for (let tick = 0; tick < 10 && text().includes('loader'); tick++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
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
  if (target.props.disabled) throw new Error('Button is disabled');
  const handler: unknown = target.props.onPress;
  if (typeof handler !== 'function') throw new Error('Missing handler');
  await act(async () => {
    handler();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  for (let tick = 0; tick < 10 && text().includes('loader'); tick++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}
const text = () => JSON.stringify(root.container.toJSON());

it.each([{ topic: '' }, { topic: ['germany', 'everyday-life'] }])(
  'rejects invalid catalogue parameters %j before reading data',
  async (params) => {
    jest.mocked(useLocalSearchParams).mockReturnValue(params);
    await render(LearningScreen);
    expect(text()).toContain('learning.topics.loadError');
    expect(api.get).not.toHaveBeenCalled();
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  },
);

it('starts with unique topics and opens a topic directly', async () => {
  await render(LearningScreen);
  await press('articles.title');
  expect(router.push).toHaveBeenCalledWith('/(tabs)/(learning)/articles');
  expect(text()).toContain('Everyday life');
  expect(text()).not.toContain('learning.chooseActivity');
  expect(() => button('B2')).toThrow('Missing button');
  expect(text()).not.toContain('learning.topics.availableLevels');
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'button' &&
        node.props.accessibilityLabel === 'Everyday life',
    ),
  ).toHaveLength(1);
  await press('Everyday life');
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/(tabs)/(learning)/topics/[topic]',
    params: { topic: 'everyday' },
  });
});
it('searches the current catalogue locally and opens the filters sheet', async () => {
  await render(LearningScreen);
  const input = root.container.queryAll((node) => node.type === 'input')[0];
  const change: unknown = input?.props.onChangeText;
  if (typeof change !== 'function') throw new Error('Missing search input');
  const requestCount = jest.mocked(api.get).mock.calls.length;
  await act(async () => {
    change(' no matching theme ');
  });
  expect(text()).toContain('learning.topics.noResults');
  expect(text()).not.toContain('Everyday life');
  expect(api.get).toHaveBeenCalledTimes(requestCount);
  await press('learning.topics.clearSearch');
  expect(text()).toContain('Everyday life');
  await press('learning.topics.filters');
  expect(text()).toContain('learning.topics.filtersSoon');
  await press('learning.topics.closeFilters');
  expect(text()).not.toContain('learning.topics.filtersSoon');
});
it('opens saved lessons directly and keeps a completed lesson after removing its bookmark', async () => {
  const catalogue = createCatalogue();
  const [parent] = catalogue.topics;
  if (!parent) throw new Error('Missing parent topic');
  const lesson = createLesson();
  const entry = {
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    availableLevels: lesson.availableLevels,
    coverImageUrl: lesson.coverImageUrl,
    thumbnailUrl: null,
  };
  jest.mocked(api.get).mockImplementation(async (_url, config) => {
    const params = config?.params;
    const hasParent =
      typeof params === 'object' &&
      params !== null &&
      'topic' in params &&
      params.topic === parent.slug;
    return {
      data: hasParent
        ? { ...catalogue, topic: parent, topics: [], lessons: [entry] }
        : catalogue,
    };
  });
  jest
    .mocked(AsyncStorage.getItem)
    .mockResolvedValue(
      JSON.stringify([
        { slug: entry.slug, topic: parent.slug, saved: true, completed: true },
      ]),
    );

  await render(LearningScreen);
  const input = root.container.queryAll((node) => node.type === 'input')[0];
  const change: unknown = input?.props.onChangeText;
  if (typeof change !== 'function') throw new Error('Missing search input');
  await act(async () => {
    change('no matching theme');
  });
  await press('learning.topics.tabs.saved');
  expect(() => button('articles.title')).toThrow('Missing button');
  expect(text()).toContain('learning.topics.completedStatus');
  expect(
    root.container.queryAll(
      (node) => node.props.accessibilityLabel === 'image.unavailable',
    ),
  ).toHaveLength(1);
  await act(async () => {
    change(` ${parent.title.toUpperCase()} `);
  });
  expect(text()).toContain(lesson.title);
  await press(lesson.title);
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/(tabs)/(learning)/lessons/[slug]',
    params: { slug: lesson.slug },
  });

  await press('learning.topics.clearSearch');
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error('Bookmark write failed'));
  await press('learning.topics.removeBookmark');
  expect(mockShowBanner).toHaveBeenCalledTimes(1);
  expect(mockShowBanner).toHaveBeenCalledWith({
    title: 'learning.topics.libraryWriteError',
    variant: 'error',
  });
  expect(text()).toContain(lesson.title);

  await press('learning.topics.removeBookmark');
  expect(text()).toContain('learning.topics.emptyTab.saved');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'readovo:lesson-library:owner',
    JSON.stringify([
      { saved: false, completed: true, slug: entry.slug, topic: parent.slug },
    ]),
  );
  await press('learning.topics.tabs.completed');
  expect(text()).toContain(lesson.title);
});

it('switches level within one lesson and explicitly shows unavailable variants', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  await render(ThematicLessonScreen);
  expect(text()).toContain('learning.lesson.reading');
  await press('B2');
  expect(text()).toContain('learning.topics.levelUnavailable');
  expect(text()).not.toContain('learning.lesson.reading');
  await press('A1');
  expect(text()).toContain('learning.lesson.reading');
});
it('uses the cover and reading artwork URLs supplied with the lesson', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  const coverImageUrl =
    '/learning/media?key=learning%2Fart%2Ftest-cover%2Fv1.png';
  const readingImageUrl =
    '/learning/media?key=learning%2Fart%2Ftest-reading%2Fv2.png';
  const readingCheckImageUrl =
    '/learning/media?key=learning%2Fart%2Ftest-check%2Fv1.png';
  jest.mocked(api.get).mockImplementation(async (url) => ({
    data:
      url === '/learning/catalogue'
        ? createCatalogue()
        : {
            ...createLesson(),
            coverImageUrl,
            readingImageUrl,
            readingCheckImageUrl,
          },
  }));

  await render(ThematicLessonScreen);
  expect(text()).toContain(coverImageUrl);
  await press('learning.lesson.reading');
  expect(text()).toContain(readingImageUrl);
  expect(text()).toContain(readingCheckImageUrl);
  expect(text()).not.toContain(coverImageUrl);
});
it('shows all lesson words as one roster and finishes at the unified lesson', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  await render(ThematicLessonScreen);
  await press('learning.lesson.words');
  const vocabulary = createLesson().variant?.vocabulary;
  expect(vocabulary).toBeDefined();
  expect(text()).toContain(vocabulary?.words.map(({ id }) => id).join(','));
  expect(text()).not.toContain('learning.lesson.back');
  await press('finish-cards');
  expect(text()).toContain('learning.lesson.comprehension');
});
it('opens the bundled vocabulary practice without another GET request', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  await render(ThematicLessonScreen);
  expect(api.get).toHaveBeenCalledWith('/learning/lessons/a-day', {
    params: { level: 'A1', locale: 'en' },
  });
  const callsBeforePractice = jest.mocked(api.get).mock.calls.length;

  await press('learning.lesson.wordTest');

  expect(text()).toContain('exercise-1,exercise-2,exercise-3');
  expect(api.get).toHaveBeenCalledTimes(callsBeforePractice);
});
it('handles navigation Back by returning from an activity to the lesson overview', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  await render(ThematicLessonScreen);
  expect(jest.mocked(usePreventRemove).mock.lastCall?.[0]).toBe(false);
  await press('learning.lesson.reading');
  const back = jest.mocked(usePreventRemove).mock.lastCall;
  if (!back) throw new Error('Missing navigation Back handler');
  expect(back[0]).toBe(true);
  await act(async () => back[1]({ data: { action: { type: 'GO_BACK' } } }));
  expect(text()).toContain('learning.lesson.path');
  expect(jest.mocked(usePreventRemove).mock.lastCall?.[0]).toBe(false);
});
it('keeps the open reading visible after a background refresh fails', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  await render(ThematicLessonScreen);
  await press('learning.lesson.reading');
  jest.mocked(api.get).mockRejectedValue(new Error('Network unavailable'));
  await act(async () => {
    await client.invalidateQueries({
      queryKey: ['learning', 'owner', 'en', 'lesson', 'a-day', 'A1'],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(text()).toContain('Anna takes an umbrella');
  expect(text()).not.toContain('learning.topics.loadError');
});

it('opens the prepared text and checks comprehension, locking answers and resetting retry', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: 'a-day' });
  jest.mocked(api.post).mockResolvedValue({
    data: {
      questionId: 'weather',
      selectedOptionId: 'sun',
      correctOptionId: 'rain',
      isCorrect: false,
      explanation: 'The text says that it is raining.',
    },
  });
  await render(ThematicLessonScreen);
  await press('learning.lesson.reading');
  expect(text()).toContain('Anna takes an umbrella');
  await press('learning.reader.largeText');
  expect(
    button('learning.reader.largeText').props.accessibilityState.selected,
  ).toBe(true);
  await press('learning.reader.largeText');
  expect(
    button('learning.reader.largeText').props.accessibilityState.selected,
  ).toBe(false);
  await press('learning.lesson.comprehension');
  expect(text()).not.toContain('The text says');
  await press('It is sunny');
  await press('vocabulary.practice.check');
  expect(text()).toContain('The text says that it is raining.');
  expect(button('It is raining').props.disabled).toBe(true);
  await press('vocabulary.cards.next');
  expect(text()).toContain('vocabulary.practice.resultTitle');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'readovo:lesson-library:owner',
    JSON.stringify([
      { saved: false, completed: true, slug: 'a-day', topic: 'everyday' },
    ]),
  );
  await press('vocabulary.practice.tryAgain');
  expect(text()).not.toContain('The text says');
  expect(button('vocabulary.practice.check').props.disabled).toBe(true);
});
