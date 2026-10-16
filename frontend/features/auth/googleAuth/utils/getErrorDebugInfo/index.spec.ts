import { getErrorDebugInfo } from './index';

describe('getErrorDebugInfo', () => {
  it.each([null, undefined, 'failed', 42, { code: '10' }])(
    'retains a non-Error thrown value %j',
    (value) => {
      expect(getErrorDebugInfo(value)).toEqual({ rawError: value });
    },
  );
  it('retains standard and native fields without mutating the Error', () => {
    const error = Object.assign(new Error('Native failure'), {
      code: '10',
      domain: 'OAuth',
      userInfo: { reason: 'config' },
      nativeStackAndroid: ['native.frame'],
    });
    expect(getErrorDebugInfo(error)).toEqual({
      name: 'Error',
      message: 'Native failure',
      code: '10',
      domain: 'OAuth',
      userInfo: { reason: 'config' },
      nativeStackAndroid: ['native.frame'],
      stack: error.stack,
    });
    expect(error.message).toBe('Native failure');
  });
});
