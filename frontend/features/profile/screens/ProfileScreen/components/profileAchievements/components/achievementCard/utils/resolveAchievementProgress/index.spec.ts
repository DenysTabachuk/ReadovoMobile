import { resolveAchievementProgress } from '.';

describe('resolveAchievementProgress', () => {
  it.each([
    [0, 10, '0%', '0/10'],
    [5, 10, '50%', '5/10'],
    [1, 3, '33%', '1/3'],
    [2, 3, '67%', '2/3'],
    [1, 8, '13%', '1/8'],
    [10, 10, '100%', '10/10'],
    [15, 10, '100%', '10/10'],
  ] as const)(
    'formats %s of %s as width %s and counter %s',
    (progressValue, targetValue, percentage, text) => {
      expect(
        resolveAchievementProgress({ progressValue, targetValue }),
      ).toEqual({
        percentage,
        text,
      });
    },
  );

  it('does not modify progress exceeding the target', () => {
    const input = Object.freeze({ progressValue: 12, targetValue: 10 });
    expect(resolveAchievementProgress(input)).toEqual({
      percentage: '100%',
      text: '10/10',
    });
    expect(input).toEqual({ progressValue: 12, targetValue: 10 });
  });
});
