import { logGoogleSignInError } from './index';

jest.mock('@react-native-google-signin/google-signin', () => ({
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error,
}));

describe('logGoogleSignInError', () => {
  let log: jest.SpyInstance;
  beforeEach(() => {
    log = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  it('logs the stage, raw error, and Android configuration without throwing', () => {
    expect(logGoogleSignInError('signIn', 'Offline')).toBeUndefined();
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('[GoogleSignIn] signIn failed', {
      error: { rawError: 'Offline' },
      config: {
        androidPackageName: 'com.readovo.mobile',
        debugSha1: expect.any(String),
      },
    });
  });
  it('adds native OAuth troubleshooting details for developer errors', () => {
    logGoogleSignInError('hasPlayServices', { code: '10' });
    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenLastCalledWith(
      expect.stringContaining('DEVELOPER_ERROR'),
      expect.objectContaining({
        requiredAndroidOAuthClient: {
          packageName: 'com.readovo.mobile',
          sha1: expect.any(String),
        },
        nextStep: expect.any(String),
      }),
    );
  });
});
