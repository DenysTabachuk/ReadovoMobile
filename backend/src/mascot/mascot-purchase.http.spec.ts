import request from 'supertest';

import {
  createMascotHttpApp,
  MASCOT_TEST_USER_ID,
  type MascotHttpTestApp,
} from './testing/create-mascot-http-app';

const path = `/mascot/profile/${MASCOT_TEST_USER_ID}/items/pirate-hat/buy`;

describe('Mascot purchase (HTTP)', () => {
  let testApp: MascotHttpTestApp;

  beforeEach(async () => {
    testApp = await createMascotHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('rejects an unknown catalog item before persistence', async () => {
    await request(testApp.server)
      .post(`/mascot/profile/${MASCOT_TEST_USER_ID}/items/unknown-item/buy`)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_ITEM_UNKNOWN',
        message: 'Unknown mascot item.',
      });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(testApp.prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects insufficient coins without charging or granting ownership', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_NOT_ENOUGH_COINS',
        message: 'Not enough coins.',
      });
    expect(testApp.prisma.user.update).not.toHaveBeenCalled();
    expect(testApp.prisma.userMascotProfile.update).not.toHaveBeenCalled();
  });

  it('retains the existing insufficient-balance outcome if the user disappears during balance lookup', async () => {
    testApp.prisma.user.findUnique
      .mockResolvedValueOnce({ id: MASCOT_TEST_USER_ID, balance: 0 })
      .mockResolvedValueOnce(null);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_NOT_ENOUGH_COINS',
        message: 'Not enough coins.',
      });
    expect(testApp.prisma.user.update).not.toHaveBeenCalled();
    expect(testApp.prisma.userMascotProfile.update).not.toHaveBeenCalled();
  });

  it('keeps purchasing an already owned item successful without charging again', async () => {
    testApp.prisma.userMascotProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      ownedItemIds: ['pirate-hat'],
    });
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(201, {
        userId: MASCOT_TEST_USER_ID,
        ownedItemIds: ['pirate-hat'],
        equippedItems: {},
      });
    expect(testApp.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(testApp.prisma.user.update).not.toHaveBeenCalled();
    expect(testApp.prisma.userMascotProfile.update).not.toHaveBeenCalled();
  });

  it('keeps a successful purchase response and catalog price unchanged', async () => {
    testApp.prisma.user.findUnique.mockResolvedValue({
      id: MASCOT_TEST_USER_ID,
      balance: 300,
    });
    testApp.prisma.user.update.mockResolvedValue(undefined);
    testApp.prisma.userMascotProfile.update.mockResolvedValue({
      ...testApp.profile,
      ownedItemIds: ['pirate-hat'],
    });
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(201, {
        userId: MASCOT_TEST_USER_ID,
        ownedItemIds: ['pirate-hat'],
        equippedItems: {},
      });
    expect(testApp.prisma.user.update).toHaveBeenCalledWith({
      data: { balance: { decrement: 300 } },
      where: { id: MASCOT_TEST_USER_ID },
    });
    expect(
      testApp.prisma.userMascotProfile.update.mock.calls[0]?.[0],
    ).toMatchObject({
      data: { ownedItemIds: ['pirate-hat'] },
      where: { userId: MASCOT_TEST_USER_ID },
    });
  });
});
