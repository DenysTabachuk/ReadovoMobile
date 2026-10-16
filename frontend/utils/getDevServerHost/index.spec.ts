import { getDevServerHost } from './index';

jest.mock('expo-constants', () => ({ __esModule: true, default: {} }));
jest.mock('expo', () => ({ getExpoGoProjectConfig: jest.fn(() => null) }));
const constants = jest.requireMock<{ default: Record<string, unknown> }>(
  'expo-constants',
).default;
const project = jest.requireMock<{ getExpoGoProjectConfig: jest.Mock }>('expo');
describe('getDevServerHost', () => {
  beforeEach(() => {
    for (const key of Object.keys(constants)) delete constants[key];
    project.getExpoGoProjectConfig.mockReturnValue(null);
  });
  it.each([
    ['http://192.168.1.20:8081/path', '192.168.1.20'],
    [' example.test:8081 ', 'example.test'],
    ['https://example.test/path', 'example.test'],
  ])('normalizes explicit %s', (input, expected) => {
    constants.expoConfig = { hostUri: 'other.test:8081' };
    expect(getDevServerHost(input)).toBe(expected);
  });
  it('prefers current Expo config over legacy metadata', () => {
    constants.expoConfig = { hostUri: 'current.test:8081' };
    constants.manifest = { debuggerHost: 'legacy.test:8081' };
    expect(getDevServerHost(' ')).toBe('current.test');
  });
  it('supports legacy manifests and Expo Go project configuration', () => {
    constants.manifest2 = {
      extra: { expoClient: { hostUri: 'legacy.test:8081' } },
    };
    expect(getDevServerHost()).toBe('legacy.test');
    delete constants.manifest2;
    project.getExpoGoProjectConfig.mockReturnValue({
      debuggerHost: 'project.test:8081',
    });
    expect(getDevServerHost()).toBe('project.test');
  });
  it('falls back to localhost without usable candidates', () => {
    expect(getDevServerHost()).toBe('localhost');
  });
});
