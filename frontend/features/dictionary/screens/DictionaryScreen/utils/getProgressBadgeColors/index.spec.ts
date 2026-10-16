import { getProgressBadgeColors } from './index';

describe('getProgressBadgeColors', () => {
  it.each([
    ['new', 'light', '#e6f4f8', '#0a7ea4'],
    ['new', 'dark', '#263238', '#7ccce6'],
    ['in_progress', 'light', '#fff2cc', '#9a6700'],
    ['in_progress', 'dark', '#3a2d14', '#ffd36a'],
    ['learned', 'light', '#dff7e8', '#1f8a4c'],
    ['learned', 'dark', '#173522', '#7ee0a0'],
  ] as const)(
    'maps %s in %s mode',
    (progress, theme, backgroundColor, textColor) => {
      expect(getProgressBadgeColors(progress, theme)).toEqual({
        backgroundColor,
        textColor,
      });
    },
  );
});
