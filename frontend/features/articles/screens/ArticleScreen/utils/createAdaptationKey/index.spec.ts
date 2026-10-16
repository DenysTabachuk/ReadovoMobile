import { createAdaptationKey } from './index';

describe('createAdaptationKey', () => {
  it('namespaces keys by both transformation and level', () => {
    expect(createAdaptationKey('A2', 'summary')).toBe('summary:A2');
    expect(createAdaptationKey('B1', 'summary')).toBe('summary:B1');
    expect(createAdaptationKey('A2', 'adaptation')).toBe('adaptation:A2');
  });
});
