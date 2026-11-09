import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import * as Speech from 'expo-speech';
import { AudioPrompt } from '.';

type MockTextProps = Pick<TextProps, 'children'>;

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => (() => void) | void) =>
    useEffect(callback, [callback]),
}));
jest.mock('expo-speech', () => ({
  stop: jest.fn().mockResolvedValue(undefined),
  speak: jest.fn(),
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => () => null);
jest.mock('react-native', () => ({
  View: (props: ViewProps) => createElement('view', props),
  Pressable: (props: PressableProps) => createElement('button', props),
}));
jest.mock('@/components/themedText', () => ({
  ThemedText: ({ children }: MockTextProps) =>
    createElement('text', null, children),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ colors: { onPrimary: '#ffffff' } }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('./styles', () => ({ createStyles: () => ({}) }));

let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(async () => {
  jest.clearAllMocks();
  jest.mocked(Speech.stop).mockResolvedValue(undefined);
  root = createRoot({ textComponentTypes: ['text'] });
  await act(async () =>
    root.render(
      createElement(AudioPrompt, {
        key: 'backpack',
        questionId: 'picture-backpack',
        word: 'Backpack',
      }),
    ),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
});

async function pressListen() {
  const onPress: unknown = root.container.queryAll(
    (node) => node.type === 'button',
  )[0]?.props.onPress;
  if (typeof onPress !== 'function') throw new Error('Missing listen action');
  await act(async () => {
    onPress();
  });
}

it('autoplays once without exposing the English answer in text or accessibility props', () => {
  expect(Speech.speak).toHaveBeenCalledTimes(1);
  expect(Speech.speak).toHaveBeenCalledWith('Backpack', expect.any(Object));
  const renderedPrompt = JSON.stringify(root.container.toJSON());
  expect(renderedPrompt).not.toContain('Backpack');
  expect(renderedPrompt).toContain('vocabulary.audio.listenAgain');
});

it('replays the same word and keeps it hidden after both requests', async () => {
  await pressListen();
  await pressListen();
  expect(Speech.speak).toHaveBeenCalledTimes(3);
  expect(Speech.speak).toHaveBeenLastCalledWith(
    'Backpack',
    expect.objectContaining({ language: 'en-US' }),
  );
  const renderedPrompt = JSON.stringify(root.container.toJSON());
  expect(renderedPrompt).not.toContain('Backpack');
  expect(renderedPrompt).toContain('vocabulary.audio.listenAgain');
});

it('stops the old question and autoplays the new question', async () => {
  await pressListen();
  const stopsBeforeChange = jest.mocked(Speech.stop).mock.calls.length;
  await act(async () =>
    root.render(
      createElement(AudioPrompt, {
        key: 'book',
        questionId: 'picture-book',
        word: 'Book',
      }),
    ),
  );
  expect(Speech.stop).toHaveBeenCalledTimes(stopsBeforeChange + 2);
  expect(Speech.speak).toHaveBeenLastCalledWith(
    'Book',
    expect.objectContaining({ language: 'en-US' }),
  );
});

it('does not restart playback when the focused prompt rerenders', async () => {
  await act(async () =>
    root.render(
      createElement(AudioPrompt, {
        key: 'backpack',
        questionId: 'picture-backpack',
        word: 'Backpack',
      }),
    ),
  );
  expect(Speech.speak).toHaveBeenCalledTimes(1);
});

it('shows a retryable speech error without revealing the answer', async () => {
  jest
    .mocked(Speech.stop)
    .mockRejectedValueOnce(new Error('No voice available'));
  await pressListen();
  const renderedPrompt = JSON.stringify(root.container.toJSON());
  expect(renderedPrompt).toContain('vocabulary.cards.speechUnavailable');
  expect(renderedPrompt).not.toContain('Backpack');
  await pressListen();
  expect(Speech.speak).toHaveBeenCalledWith('Backpack', expect.any(Object));
  expect(JSON.stringify(root.container.toJSON())).not.toContain(
    'vocabulary.cards.speechUnavailable',
  );
});
