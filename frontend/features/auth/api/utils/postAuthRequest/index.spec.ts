import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { postAuthRequest } from './index';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
describe('postAuthRequest', () => {
  afterEach(() => jest.restoreAllMocks());
  it('parses a successful JSON response without attaching session credentials', async () => {
    const adapter = mockHttpAdapter().mockResolvedValue(
      createHttpResponse('{"email":"reader@example.test"}', { status: 201 }),
    );
    const response = await postAuthRequest<{ email: string }>(
      'request-password-reset',
      { email: 'reader@example.test' },
    );
    expect(response.data).toEqual({ email: 'reader@example.test' });
    expect(adapter.mock.calls[0]?.[0].headers).not.toHaveProperty(
      'Authorization',
    );
  });
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
