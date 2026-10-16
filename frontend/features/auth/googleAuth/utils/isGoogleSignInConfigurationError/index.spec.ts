import { isGoogleSignInConfigurationError } from './index';

jest.mock('@react-native-google-signin/google-signin', () => ({
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error,
}));

describe('isGoogleSignInConfigurationError', () => {
  it.each(['DEVELOPER_ERROR', '10'])(
    'recognizes native configuration code %s',
    (code) => {
      expect(isGoogleSignInConfigurationError({ code })).toBe(true);
    },
  );
  it.each([
    null,
    undefined,
    'DEVELOPER_ERROR',
    new Error('10'),
    { code: 'OTHER' },
    { code: 10 },
  ])('rejects unrelated values %j', (value) => {
    expect(isGoogleSignInConfigurationError(value)).toBe(false);
  });
});
