import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { type UserMascotProfile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getMascotCatalogItem } from './catalog';
import { type MascotAccessorySlot, type MascotProfileResponse } from './types';

@Injectable()
export class MascotService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<MascotProfileResponse> {
    await this.ensureUserExists(userId);
    const row = await this.ensureMascotProfile(userId);

    return this.mapProfileRow(userId, row);
  }

  async buyItem(
    userId: string,
    itemId: string,
  ): Promise<MascotProfileResponse> {
    const item = getMascotCatalogItem(itemId);

    if (!item) {
      throw new BadRequestException('Unknown mascot item.');
    }

    await this.ensureUserExists(userId);
    const profile = await this.ensureMascotProfile(userId);

    if (profile.ownedItemIds.includes(itemId)) {
      return this.mapProfileRow(userId, profile);
    }

    const user = await this.prisma.user.findUnique({
      select: { balance: true },
      where: { id: userId },
    });
    const balance = user?.balance ?? 0;

    if (balance < item.price) {
      throw new BadRequestException('Not enough coins.');
    }

    await this.prisma.user.update({
      data: { balance: { decrement: item.price } },
      where: { id: userId },
    });

    const updatedProfile = await this.addOwnedItem(userId, itemId);

    return this.mapProfileRow(userId, updatedProfile);
  }

  async equipItem(
    userId: string,
    itemId: string,
  ): Promise<MascotProfileResponse> {
    const item = getMascotCatalogItem(itemId);

    if (!item) {
      throw new BadRequestException('Unknown mascot item.');
    }

    await this.ensureUserExists(userId);
    const profile = await this.ensureMascotProfile(userId);

    if (!profile.ownedItemIds.includes(itemId)) {
      throw new BadRequestException('Mascot item is not owned.');
    }

    const updatedProfile = await this.prisma.userMascotProfile.update({
      data:
        item.slot === 'eyes'
          ? {
              equippedEyePatchId: null,
              equippedEyesItemId: itemId,
              equippedGlassesId: null,
              updatedAt: new Date(),
            }
          : {
              equippedBandanaId: null,
              equippedHatId: null,
              equippedHeadItemId: itemId,
              updatedAt: new Date(),
            },
      where: { userId },
    });

    return this.mapProfileRow(userId, updatedProfile);
  }

  async clearSlot(
    userId: string,
    slot: MascotAccessorySlot,
  ): Promise<MascotProfileResponse> {
    await this.ensureUserExists(userId);
    await this.ensureMascotProfile(userId);
    this.assertValidSlot(slot);

    const updatedProfile = await this.prisma.userMascotProfile.update({
      data:
        slot === 'eyes'
          ? {
              equippedEyePatchId: null,
              equippedEyesItemId: null,
              equippedGlassesId: null,
              updatedAt: new Date(),
            }
          : {
              equippedBandanaId: null,
              equippedHatId: null,
              equippedHeadItemId: null,
              updatedAt: new Date(),
            },
      where: { userId },
    });

    return this.mapProfileRow(userId, updatedProfile);
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      select: { id: true },
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private ensureMascotProfile(userId: string): Promise<UserMascotProfile> {
    return this.prisma.userMascotProfile.upsert({
      create: { userId },
      update: {},
      where: { userId },
    });
  }

  private async addOwnedItem(
    userId: string,
    itemId: string,
  ): Promise<UserMascotProfile> {
    const profile = await this.ensureMascotProfile(userId);

    if (profile.ownedItemIds.includes(itemId)) {
      return profile;
    }

    return this.prisma.userMascotProfile.update({
      data: {
        ownedItemIds: [...profile.ownedItemIds, itemId],
        updatedAt: new Date(),
      },
      where: { userId },
    });
  }

  private assertValidSlot(slot: MascotAccessorySlot): void {
    const validSlots: MascotAccessorySlot[] = ['eyes', 'head'];

    if (!validSlots.includes(slot)) {
      throw new BadRequestException('Unknown mascot slot.');
    }
  }

  private mapProfileRow(
    userId: string,
    row: UserMascotProfile,
  ): MascotProfileResponse {
    return {
      equippedItems: {
        eyes:
          row.equippedEyesItemId ??
          row.equippedGlassesId ??
          row.equippedEyePatchId ??
          undefined,
        head:
          row.equippedHeadItemId ??
          row.equippedHatId ??
          row.equippedBandanaId ??
          undefined,
      },
      ownedItemIds: row.ownedItemIds,
      userId,
    };
  }
}
