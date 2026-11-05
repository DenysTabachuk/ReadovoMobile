import { themeColors } from '@/constants/theme';
import { getProgressBadgeColors } from './index';
jest.mock('react-native', () => ({ Platform: { select: () => ({}) } }));

describe('getProgressBadgeColors', () => {
  it.each([
    ['new', 'light', '#e8f1ff', '#245aa8'],
    ['new', 'dark', '#111b2e', '#93c5fd'],
    ['in_progress', 'light', '#fff2cc', '#805400'],
    ['in_progress', 'dark', '#3a2d14', '#ffd36a'],
    ['learned', 'light', '#dff7e8', '#217a3b'],
    ['learned', 'dark', '#173522', '#7ee0a0'],
  ] as const)(
    'maps %s in %s mode',
    (progress, theme, backgroundColor, textColor) => {
      expect(getProgressBadgeColors(progress, themeColors[theme])).toEqual({
        backgroundColor,
        textColor,
      });
    },
  );
});
