import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Button } from '@/components/button';
import VocabularySentencePracticeScreen from '.';

type MockTextProps = Pick<TextProps, 'children'>;

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ lessonId: 'common-things' })),
  router: { replace: jest.fn(), dismissTo: jest.fn() },
}));
jest.mock('../../assets/backpack.svg', () => 1);
jest.mock('../../assets/book.svg', () => 2);
jest.mock('../../assets/pencil.svg', () => 3);
jest.mock('../../../../assets/images/learning/vocabulary.png', () => 4);
jest.mock('@expo/vector-icons/MaterialIcons', () => () => null);
jest.mock('react-native', () => ({
  View: (props: ViewProps) => createElement('view', props),
  Pressable: (props: PressableProps) => createElement('button', props),
}));
jest.mock('@/components/themedText', () => ({
  ThemedText: ({ children }: MockTextProps) =>
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
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (values) return `${key} ${JSON.stringify(values)}`;
      return key;
    },
  }),
}));
jest.mock('./styles', () => ({ createStyles: () => ({}) }));
jest.mock('./components/wordOption/styles', () => ({
  createStyles: () => ({}),
}));
jest.mock('../../components/practiceProgress/styles', () => ({
  createStyles: () => ({}),
}));
jest.mock('../../components/practiceResult/styles', () => ({
  createStyles: () => ({}),
}));

let root: Root;

beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
beforeEach(async () => {
  jest
    .mocked(useLocalSearchParams)
    .mockReturnValue({ lessonId: 'common-things' });
  root = createRoot({ textComponentTypes: ['text'] });
  await act(async () =>
    root.render(createElement(VocabularySentencePracticeScreen)),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
});

function button(label: string) {
  const target = root.container.queryAll(
    (node) =>
      node.type === 'button' &&
      (node.props.accessibilityLabel === label ||
        node.props.children === label),
  )[0];
  if (!target) throw new Error(`Missing button: ${label}`);
  return target;
}
async function press(label: string) {
  const target = button(label);
  if (target.props.disabled) throw new Error(`Disabled button: ${label}`);
  const onPress: unknown = target.props.onPress;
  if (typeof onPress !== 'function') throw new Error('Missing press handler');
  await act(async () => {
    onPress();
  });
}
function rendered() {
  return JSON.stringify(root.container.toJSON());
}

it('keeps the gap and translation hidden until checking, then locks choices and reveals the correct sentence', async () => {
  expect(button('vocabulary.practice.check').props.disabled).toBe(true);
  expect(rendered()).toContain('___');
  expect(rendered()).not.toContain('vocabulary.sentences.backpack');
  await press('book');
  expect(rendered()).toContain('___');
  await press('vocabulary.practice.check');
  expect(rendered()).not.toContain('___');
  expect(rendered()).toContain('vocabulary.practice.incorrect');
  expect(rendered()).toContain('vocabulary.sentences.backpack');
  expect(button('backpack').props.disabled).toBe(true);
  expect(button('book').props.accessibilityState).toEqual({
    selected: true,
    disabled: true,
  });
  await press('vocabulary.cards.next');
  expect(rendered()).toContain('I read a ');
  expect(rendered()).not.toContain('vocabulary.sentences.backpack');
  expect(button('vocabulary.practice.check').props.disabled).toBe(true);
});

it('scores the first attempt and resets both sentence and answers when retrying', async () => {
  for (const [word, action] of [
    ['book', 'vocabulary.cards.next'],
    ['book', 'vocabulary.cards.next'],
    ['pencil', 'vocabulary.practice.showResult'],
  ]) {
    await press(word);
    await press('vocabulary.practice.check');
    await press(action);
  }
  expect(rendered()).toContain('vocabulary.practice.score');
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'text' &&
        node.props.children ===
          'vocabulary.practice.score {"correct":2,"total":3}',
    ),
  ).toHaveLength(1);
  expect(rendered()).toContain('vocabulary.words.backpack.translation');
  expect(rendered()).not.toContain('vocabulary.words.book.translation');
  await press('vocabulary.practice.tryAgain');
  expect(rendered()).toContain('I carry my books to school in a ');
  expect(rendered()).toContain('___');
  expect(button('vocabulary.practice.check').props.disabled).toBe(true);
});

it('does not offer questions for an unknown lesson', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ lessonId: 'unknown' });
  await act(async () =>
    root.render(createElement(VocabularySentencePracticeScreen)),
  );
  expect(rendered()).toContain('vocabulary.notFound');
  expect(rendered()).not.toContain('I carry my books');
});
