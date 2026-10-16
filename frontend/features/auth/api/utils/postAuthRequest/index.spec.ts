import { postAuthRequest } from './index';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
describe('postAuthRequest', () => {
  afterEach(() => jest.restoreAllMocks());
  it('serializes JSON to the auth path and returns even non-OK responses untouched', async () => {
    const response = new Response('Denied', { status: 401 });
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response);
    await expect(
      postAuthRequest('login', { email: 'reader@example.test' }),
    ).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"email":"reader@example.test"}',
      },
    );
  });
  it('propagates network failures', async () => {
    const failure = new Error('Offline');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(failure);
    await expect(postAuthRequest('login', {})).rejects.toBe(failure);
  });
});
