import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import { themeColors, type Theme } from '@/constants/theme';
import type { QuizQuestion } from '../../../../types';
import { QuestionOptions } from '.';

jest.mock('react-native', () => ({
  Platform: { select: () => ({}) },
  StyleSheet: { create: (styles: unknown) => styles },
  View: (props: ViewProps) => createElement('view', props),
  Text: (props: TextProps) => {
    mockTexts.push(props);
    return null;
  },
  Pressable: (props: PressableProps) => {
    mockOptions.push(props);
    return createElement('option', props);
  },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    colors: themeColors[mockTheme],
    isDark: mockTheme === 'dark',
  }),
}));
let mockTheme: Theme = 'light';
const mockOptions: PressableProps[] = [];
const mockTexts: TextProps[] = [];
const QUESTION: QuizQuestion = {
  id: 'question',
  prompt: 'Pick an answer',
  type: 'single_choice',
  options: [
    { id: 'right', text: 'Right' },
    { id: 'wrong', text: 'Wrong' },
  ],
};
let root: Root;
function resolveStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style))
    return Object.assign({}, ...style.map(resolveStyle));
  if (typeof style === 'object' && style !== null) return { ...style };
  return {};
}
function optionStyle(index: number) {
  const props = mockOptions[index];
  const style =
    typeof props.style === 'function'
      ? props.style({ pressed: false, hovered: false })
      : props.style;
  return resolveStyle(style);
}
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  root = createRoot();
  mockOptions.length = 0;
  mockTexts.length = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it.each([
  ['light', '#dff7e8', '#fdecec', '#217a3b', '#a61b1b'],
  ['dark', '#173522', '#46191f', '#7ee0a0', '#ff8076'],
] as const)(
  'preserves selected/disabled states and uses readable submitted roles in %s mode',
  async (theme, correctSurface, wrongSurface, correctText, wrongText) => {
    mockTheme = theme;
    await act(async () =>
      root.render(
        createElement(QuestionOptions, {
          question: QUESTION,
          isSubmitted: false,
          isSubmitting: true,
          selectedOptionIds: ['wrong'],
          resolvedCorrectOptionIds: [],
          onSelectOption: jest.fn(),
        }),
      ),
    );
    expect(mockOptions.every((props) => props.disabled)).toBe(true);
    expect(optionStyle(1)).toMatchObject({
      backgroundColor: '#0a7ea4',
      opacity: 0.6,
    });
    mockOptions.length = 0;
    mockTexts.length = 0;
    await act(async () =>
      root.render(
        createElement(QuestionOptions, {
          question: QUESTION,
          isSubmitted: true,
          isSubmitting: false,
          selectedOptionIds: ['wrong'],
          resolvedCorrectOptionIds: ['right'],
          onSelectOption: jest.fn(),
        }),
      ),
    );
    expect(mockOptions.every((props) => props.disabled)).toBe(true);
    expect(optionStyle(0)).toMatchObject({ backgroundColor: correctSurface });
    expect(optionStyle(1)).toMatchObject({ backgroundColor: wrongSurface });
    expect(
      resolveStyle(
        mockTexts.find((props) => props.children === 'Right')?.style,
      ),
    ).toMatchObject({ color: correctText });
    expect(
      resolveStyle(
        mockTexts.find((props) => props.children === 'Wrong')?.style,
      ),
    ).toMatchObject({ color: wrongText });
  },
);
