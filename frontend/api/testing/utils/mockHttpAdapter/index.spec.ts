import { createHttpClient } from '../../../utils/createHttpClient';
import { mockHttpAdapter } from '.';
import { httpClient } from '../../../httpClient';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'https://api.example.test' }));

const sessionHttpClient = createHttpClient();

it('intercepts both clients and fails unexpected requests without network access', async () => {
  const adapter = mockHttpAdapter(sessionHttpClient);
  await expect(httpClient.get('/unexpected')).rejects.toThrow(
    'Unexpected HTTP request',
  );
  await expect(sessionHttpClient.get('/unexpected')).rejects.toThrow(
    'Unexpected HTTP request',
  );
  expect(adapter).toHaveBeenCalledTimes(2);
});
