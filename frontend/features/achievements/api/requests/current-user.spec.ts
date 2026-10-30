import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { getAchievementsProfile } from './getAchievementsProfile';

jest.mock('@/features/auth', () => ({
  api: jest.requireActual('@/api/httpClient').httpClient,
}));

it('getAchievementsProfile sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await getAchievementsProfile();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/achievements/profile/me',
    method: 'get',
  });
});
