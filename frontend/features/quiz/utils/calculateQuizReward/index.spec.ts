import { calculateQuizReward } from './index';

describe('calculateQuizReward', () => {
  it.each([
    [0, 10],
    [39, 10],
    [40, 16],
    [59, 16],
    [60, 20],
    [74, 20],
    [75, 26],
    [89, 26],
    [90, 32],
    [99, 32],
    [100, 42],
  ])('rewards accuracy %i at its tier boundary', (percentage, expected) => {
    expect(calculateQuizReward({ percentage })).toBe(expected);
  });
  it('adds the first-test bonus and perfect-result bonus independently', () => {
    expect(
      calculateQuizReward({ percentage: 75, isFirstTestCompleted: true }),
    ).toBe(36);
    expect(
      calculateQuizReward({ percentage: 100, isFirstTestCompleted: true }),
    ).toBe(52);
  });
  it('combines level and length multipliers before rounding and adding bonuses', () => {
    expect(
      calculateQuizReward({
        percentage: 75,
        level: 'A2',
        targetLength: 'medium',
      }),
    ).toBe(37);
    expect(
      calculateQuizReward({
        percentage: 100,
        level: 'B2',
        targetLength: 'long',
      }),
    ).toBe(101);
  });
});
