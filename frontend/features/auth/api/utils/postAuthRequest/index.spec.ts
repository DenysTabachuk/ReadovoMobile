import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { postAuthRequest } from './index';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
describe('postAuthRequest', () => {
  afterEach(() => jest.restoreAllMocks());
  it('serializes JSON to the auth path and rejects unsuccessful responses', async () => {
    const response = createHttpResponse('Denied', { status: 401 });
    const fetchMock = mockHttpAdapter().mockResolvedValue(response);
    await expect(
      postAuthRequest('login', { email: 'reader@example.test' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.test/auth/login',
        method: 'post',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        data: '{"email":"reader@example.test"}',
      }),
    );
  });
  it('propagates network failures', async () => {
    const failure = new Error('Offline');
    mockHttpAdapter().mockRejectedValue(failure);
    await expect(postAuthRequest('login', {})).rejects.toBe(failure);
  });
});
