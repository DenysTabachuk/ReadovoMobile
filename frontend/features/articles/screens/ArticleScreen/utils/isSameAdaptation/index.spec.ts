import { isSameAdaptation } from './index';

describe('isSameAdaptation', () => {
  const adaptation = {
    level: 'A2' as const,
    transformationType: 'summary' as const,
  };
  it('requires an exact match on both fields', () => {
    expect(isSameAdaptation(adaptation, 'A2', 'summary')).toBe(true);
    expect(isSameAdaptation(adaptation, 'B1', 'summary')).toBe(false);
    expect(isSameAdaptation(adaptation, 'A2', 'adaptation')).toBe(false);
  });
});
