import { isJwtExpired } from './index';

describe('isJwtExpired', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-16T12:00:00.000Z'));
  });
  afterEach(() => jest.useRealTimers());
  it('treats expiration at the current second as expired, but a future expiration as valid', () => {
    const nowSeconds = 1792152000;
    const expired = `header.${btoa(JSON.stringify({ exp: nowSeconds }))}.signature`;
    const future = `header.${btoa(JSON.stringify({ exp: nowSeconds + 1 }))}.signature`;
    expect(isJwtExpired(expired)).toBe(true);
    expect(isJwtExpired(future)).toBe(false);
  });
  it.each([null, '', 'bad-token', 'header.not-valid-base64!.signature'])(
    'treats unusable token %j as expired',
    (token) => {
      expect(isJwtExpired(token)).toBe(true);
    },
  );
  it.each([{}, { exp: '1792152001' }])(
    'rejects a missing or nonnumeric expiration %j',
    (payload) => {
      expect(
        isJwtExpired(`header.${btoa(JSON.stringify(payload))}.signature`),
      ).toBe(true);
    },
  );
});
