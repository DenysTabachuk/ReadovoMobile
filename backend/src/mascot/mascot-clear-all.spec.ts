import { Test } from '@nestjs/testing';

import type { UserMascotProfile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MascotService } from './mascot.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('MascotService.clearAllSlots', () => {
  const createPrisma = () => ({
    user: {
      findUnique: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
    },
    userMascotProfile: {
      upsert: jest.fn<Promise<UserMascotProfile>, [unknown]>(),
      update: jest.fn<Promise<UserMascotProfile>, [unknown]>(),
    },
  });
  let prisma: ReturnType<typeof createPrisma>;
  let service: MascotService;
  let profile: UserMascotProfile;

  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date('2026-11-01T12:00:00.000Z') });
    prisma = createPrisma();
    profile = {
      userId: USER_ID,
      ownedItemIds: ['pirate-hat', 'glasses'],
      equippedHeadItemId: null,
      equippedEyesItemId: null,
      equippedHatId: null,
      equippedBandanaId: null,
      equippedGlassesId: null,
      equippedEyePatchId: null,
      updatedAt: new Date('2026-11-01T12:00:00.000Z'),
    };
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID });
    prisma.userMascotProfile.update.mockResolvedValue(profile);
    const module = await Test.createTestingModule({
      providers: [MascotService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MascotService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    {
      state: 'current equipment',
      equipment: {
        equippedHeadItemId: 'pirate-hat',
        equippedEyesItemId: 'glasses',
      },
    },
    {
      state: 'legacy equipment',
      equipment: { equippedHatId: 'pirate-hat', equippedGlassesId: 'glasses' },
    },
    { state: 'already empty slots', equipment: {} },
  ])(
    'clears $state in one update without changing ownership',
    async ({ equipment }) => {
      prisma.userMascotProfile.upsert.mockResolvedValue({
        ...profile,
        ...equipment,
      });

      await expect(service.clearAllSlots(USER_ID)).resolves.toEqual({
        userId: USER_ID,
        ownedItemIds: ['pirate-hat', 'glasses'],
        equippedItems: {},
      });

      expect(prisma.userMascotProfile.update).toHaveBeenCalledTimes(1);
      expect(prisma.userMascotProfile.update).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        data: {
          equippedHeadItemId: null,
          equippedEyesItemId: null,
          equippedHatId: null,
          equippedBandanaId: null,
          equippedGlassesId: null,
          equippedEyePatchId: null,
          updatedAt: new Date('2026-11-01T12:00:00.000Z'),
        },
      });
    },
  );

  it('does not change equipment for a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.clearAllSlots(USER_ID)).rejects.toThrow(
      'User not found.',
    );

    expect(prisma.userMascotProfile.upsert).not.toHaveBeenCalled();
    expect(prisma.userMascotProfile.update).not.toHaveBeenCalled();
  });

  it('propagates a failed update without attempting per-slot writes', async () => {
    prisma.userMascotProfile.upsert.mockResolvedValue(profile);
    const error = new Error('Database unavailable');
    prisma.userMascotProfile.update.mockRejectedValue(error);

    await expect(service.clearAllSlots(USER_ID)).rejects.toBe(error);

    expect(prisma.userMascotProfile.update).toHaveBeenCalledTimes(1);
  });
});
