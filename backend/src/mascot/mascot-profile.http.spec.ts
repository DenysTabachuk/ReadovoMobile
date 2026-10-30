import request from 'supertest';

import {
  createMascotHttpApp,
  MASCOT_TEST_USER_ID,
  type MascotHttpTestApp,
} from './testing/create-mascot-http-app';

describe('Mascot profile and request boundaries (HTTP)', () => {
  let testApp: MascotHttpTestApp;

  beforeEach(async () => {
    testApp = await createMascotHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each([
    { method: 'get', suffix: '' },
    { method: 'post', suffix: '/items/pirate-hat/buy' },
    { method: 'post', suffix: '/items/pirate-hat/equip' },
    { method: 'delete', suffix: '/slots/head' },
  ] as const)(
    'returns a domain 404 for a missing user on $method $suffix',
    async ({ method, suffix }) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [method](`/mascot/profile/me${suffix}`)
        .set('Authorization', testApp.authorization)
        .expect(404, {
          statusCode: 404,
          code: 'MASCOT_USER_NOT_FOUND',
          message: 'User not found.',
        });
      expect(testApp.prisma.userMascotProfile.upsert).not.toHaveBeenCalled();
    },
  );

  it('keeps an empty profile response unchanged', async () => {
    await request(testApp.server)
      .get(`/mascot/profile/me`)
      .set('Authorization', testApp.authorization)
      .expect(200, {
        userId: MASCOT_TEST_USER_ID,
        ownedItemIds: [],
        equippedItems: {},
      });
  });

  it('preserves legacy equipped-item fields when reading a stored profile', async () => {
    testApp.prisma.userMascotProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      equippedHatId: 'pirate-hat',
      equippedGlassesId: 'glasses',
      ownedItemIds: ['pirate-hat', 'glasses'],
    });
    await request(testApp.server)
      .get(`/mascot/profile/me`)
      .set('Authorization', testApp.authorization)
      .expect(200, {
        userId: MASCOT_TEST_USER_ID,
        ownedItemIds: ['pirate-hat', 'glasses'],
        equippedItems: { head: 'pirate-hat', eyes: 'glasses' },
      });
  });

  it('rejects a missing JWT before persistence', async () => {
    await request(testApp.server).get(`/mascot/profile/me`).expect(401, {
      statusCode: 401,
      code: 'AUTH_AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.',
    });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each(['buy', 'equip'])(
    'rejects a blank item ID through DTO validation on %s',
    async (operation) => {
      const response = await request(testApp.server)
        .post(`/mascot/profile/me/items/%20/${operation}`)
        .set('Authorization', testApp.authorization)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: ['itemId'], rule: 'VALUE_REQUIRED' }] },
      });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it('hides unexpected persistence failures', async () => {
    testApp.prisma.userMascotProfile.upsert.mockRejectedValue(
      new Error('secret database credentials'),
    );
    await request(testApp.server)
      .get(`/mascot/profile/me`)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });
});
