import { getGoogleSignInUserMessage } from './index';

jest.mock('@react-native-google-signin/google-signin', () => ({
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error,
}));

describe('getGoogleSignInUserMessage', () => {
  let log: jest.SpyInstance;
  beforeEach(() => {
    log = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  it.each([
    ['IN_PROGRESS', 'auth.errors.googleSignInInProgress'],
    [
      'PLAY_SERVICES_NOT_AVAILABLE',
      'auth.errors.googlePlayServicesUnavailable',
    ],
    ['DEVELOPER_ERROR', 'auth.errors.googleDeveloperError'],
    ['10', 'auth.errors.googleDeveloperError'],
    ['OTHER', null],
  ])('maps %s to its UI message', (code, expected) => {
    expect(getGoogleSignInUserMessage({ code })).toBe(expected);
  });
  it('logs OAuth guidance only for configuration errors', () => {
    getGoogleSignInUserMessage({ code: 'OTHER' });
    expect(log).not.toHaveBeenCalled();
    getGoogleSignInUserMessage({ code: '10' });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('com.readovo.mobile'),
    );
  });
});
