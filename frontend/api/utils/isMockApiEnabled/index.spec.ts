import { isMockApiEnabled } from './index';

jest.mock('../../config', () => ({ API_BASE_URL: 'http://localhost:3101' }));
const config = jest.requireMock<{ API_BASE_URL: string }>('../../config');
describe('isMockApiEnabled', () => {
  it.each([
    ['http://localhost:3101', true],
    ['http://192.168.1.2:3101/api', true],
    ['https://api.example.test', false],
    ['http://localhost:3000', false],
    ['http://localhost:31010', false],
    ['https://api.example.test/path:3101', false],
    ['invalid', false],
  ])('detects the exact mock-server port in %s', (url, expected) => {
    config.API_BASE_URL = url;
    expect(isMockApiEnabled()).toBe(expected);
  });
});
