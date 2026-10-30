import request from 'supertest';

import {
  createMascotHttpApp,
  MASCOT_TEST_USER_ID,
  type MascotHttpTestApp,
} from './testing/create-mascot-http-app';

describe('Mascot equipment (HTTP)', () => {
  let testApp: MascotHttpTestApp;

  beforeEach(async () => {
    testApp = await createMascotHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('rejects an unknown catalog item before persistence', async () => {
    await request(testApp.server)
      .post(`/mascot/profile/me/items/unknown-item/equip`)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_ITEM_UNKNOWN',
        message: 'Unknown mascot item.',
      });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a known item that is not owned', async () => {
    await request(testApp.server)
      .post(`/mascot/profile/me/items/glasses/equip`)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_ITEM_NOT_OWNED',
        message: 'Mascot item is not owned.',
      });
    expect(testApp.prisma.userMascotProfile.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown slot through DTO validation before persistence', async () => {
    const response = await request(testApp.server)
      .delete(`/mascot/profile/me/slots/shoes`)
      .set('Authorization', testApp.authorization)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['slot'], rule: 'VALUE_NOT_ALLOWED' }] },
    });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(testApp.prisma.userMascotProfile.update).not.toHaveBeenCalled();
  });

  it.each([
    {
      itemId: 'glasses',
      slot: 'eyes',
      field: 'equippedEyesItemId',
      cleared: { equippedGlassesId: null, equippedEyePatchId: null },
    },
    {
      itemId: 'pirate-hat',
      slot: 'head',
      field: 'equippedHeadItemId',
      cleared: { equippedHatId: null, equippedBandanaId: null },
    },
  ])(
    'keeps equipping an owned $slot item successful',
    async ({ itemId, slot, field, cleared }) => {
      testApp.prisma.userMascotProfile.upsert.mockResolvedValue({
        ...testApp.profile,
        ownedItemIds: [itemId],
      });
      testApp.prisma.userMascotProfile.update.mockResolvedValue({
        ...testApp.profile,
        ownedItemIds: [itemId],
        [field]: itemId,
      });
      await request(testApp.server)
        .post(`/mascot/profile/me/items/${itemId}/equip`)
        .set('Authorization', testApp.authorization)
        .expect(201, {
          userId: MASCOT_TEST_USER_ID,
          ownedItemIds: [itemId],
          equippedItems: { [slot]: itemId },
        });
      expect(
        testApp.prisma.userMascotProfile.update.mock.calls[0]?.[0],
      ).toMatchObject({
        data: { [field]: itemId, ...cleared },
        where: { userId: MASCOT_TEST_USER_ID },
      });
      expect(testApp.prisma.user.update).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      slot: 'eyes',
      cleared: {
        equippedEyesItemId: null,
        equippedGlassesId: null,
        equippedEyePatchId: null,
      },
    },
    {
      slot: 'head',
      cleared: {
        equippedHeadItemId: null,
        equippedHatId: null,
        equippedBandanaId: null,
      },
    },
  ])('keeps clearing the $slot slot successful', async ({ slot, cleared }) => {
    testApp.prisma.userMascotProfile.update.mockResolvedValue(testApp.profile);
    await request(testApp.server)
      .delete(`/mascot/profile/me/slots/${slot}`)
      .set('Authorization', testApp.authorization)
      .expect(200, {
        userId: MASCOT_TEST_USER_ID,
        ownedItemIds: [],
        equippedItems: {},
      });
    expect(
      testApp.prisma.userMascotProfile.update.mock.calls[0]?.[0],
    ).toMatchObject({ data: cleared, where: { userId: MASCOT_TEST_USER_ID } });
  });
});
