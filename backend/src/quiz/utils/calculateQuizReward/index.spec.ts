import { calculateQuizReward } from '.';

describe('calculateQuizReward', () => {
  it('uses neutral multipliers for dictionary quizzes with no saved level or length', () => {
    expect(
      calculateQuizReward({
        percentage: 100,
        level: null,
        targetLength: null,
        firstTest: true,
      }),
    ).toBe(52);
  });
  it.each([
    ['A1', 20],
    ['A2', 24],
    ['B1', 30],
    ['B2', 38],
    ['C1', 38],
  ] as const)('preserves the reward tier for %s', (level, expected) => {
    expect(calculateQuizReward({ percentage: 60, level })).toBe(expected);
  });
  it.each([
    ['short', 20],
    ['medium', 24],
    ['long', 30],
  ] as const)(
    'preserves the length multiplier for %s',
    (targetLength, expected) => {
      expect(calculateQuizReward({ percentage: 60, targetLength })).toBe(
        expected,
      );
    },
  );
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
    expect(calculateQuizReward({ percentage: 75, firstTest: true })).toBe(36);
    expect(calculateQuizReward({ percentage: 100, firstTest: true })).toBe(52);
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
