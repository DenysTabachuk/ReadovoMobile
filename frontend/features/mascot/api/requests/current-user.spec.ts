import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { getMascotProfile } from './getMascotProfile';
import { buyMascotItem } from './buyMascotItem';
import { equipMascotItem } from './equipMascotItem';
import { clearMascotSlot } from './clearMascotSlot';

jest.mock('@/features/auth', () => ({
  api: jest.requireActual('@/api/httpClient').httpClient,
}));

it('getMascotProfile sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await getMascotProfile();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/mascot/profile/me',
    method: 'get',
  });
});

it('buyMascotItem sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await buyMascotItem('pirate-hat');
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/mascot/profile/me/items/pirate-hat/buy',
    method: 'post',
  });
});

it('equipMascotItem sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await equipMascotItem('glasses');
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/mascot/profile/me/items/glasses/equip',
    method: 'post',
  });
});

it('clearMascotSlot sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await clearMascotSlot('head');
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/mascot/profile/me/slots/head',
    method: 'delete',
  });
});
