import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import type { Button } from '@/components/button';
import { createVocabularyWords } from '../../testing/wordFixtures';
import { WordCards } from '.';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native', () => ({
  View: (props: ViewProps) => createElement('view', props),
  Pressable: (props: PressableProps) => createElement('button', props),
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
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('expo-image', () => ({ Image: () => createElement('image') }));
jest.mock('@/features/learningMedia', () => ({
  LearningArtwork: ({ imageUrl }: { imageUrl: string | null }) =>
    createElement('image', { imageUrl }),
}));
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
beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
beforeEach(() => {
  root = createRoot({ textComponentTypes: ['text'] });
});
afterEach(async () => {
  await act(async () => root.unmount());
});

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

it('shows the full ordered vocabulary roster and continues after the final card', async () => {
  const words = createVocabularyWords().reverse();
  const onContinue = jest.fn();
  await act(async () =>
    root.render(
      createElement(WordCards, { title: 'Oktoberfest', words, onContinue }),
    ),
  );

  expect(text()).toContain('Sample word 20');
  expect(text()).toContain('Translation 20');
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'image' &&
        node.props.imageUrl ===
          '/learning/media?key=vocabulary%2Fsample%2Fword-20%2Fv1.png',
    ),
  ).toHaveLength(1);
  expect(button('vocabulary.cards.previous').props.disabled).toBe(true);
  for (let count = 1; count < words.length; count += 1)
    await press('vocabulary.cards.next');
  expect(text()).toContain('Sample word 1');
  await press('vocabulary.cards.continue');
  expect(onContinue).toHaveBeenCalledTimes(1);
});
