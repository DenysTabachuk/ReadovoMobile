import { shouldRetryQuery } from '.';

describe('shouldRetryQuery', () => {
  it('retains one retry for ordinary query failures', () => {
    expect(shouldRetryQuery(0, new Error('Offline'))).toBe(true);
    expect(shouldRetryQuery(1, new Error('Offline'))).toBe(false);
    expect(shouldRetryQuery(2, new Error('Offline'))).toBe(false);
  });

  it('never retries an aborted operation under a potentially different session', () => {
    const error = new Error('Authentication session changed.');
    error.name = 'AbortError';
    expect(shouldRetryQuery(0, error)).toBe(false);
  });
});
