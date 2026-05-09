import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { getMascotCatalogItem } from './catalog';
import { type MascotAccessorySlot, type MascotProfileResponse } from './types';

type MascotProfileRow = {
  equipped_bandana_id: string | null;
  equipped_eyes_item_id: string | null;
  equipped_eye_patch_id: string | null;
  equipped_glasses_id: string | null;
  equipped_head_item_id: string | null;
  equipped_hat_id: string | null;
  owned_item_ids: string[];
};

type UserBalanceRow = {
  balance: number;
};

@Injectable()
export class MascotService {
  constructor(private readonly databaseService: DatabaseService) {}

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

    if (profile.owned_item_ids.includes(itemId)) {
      return this.mapProfileRow(userId, profile);
    }

    const balanceResult = await this.databaseService.query<UserBalanceRow>(
      `
        SELECT balance
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );
    const balance = balanceResult.rows[0]?.balance ?? 0;

    if (balance < item.price) {
      throw new BadRequestException('Not enough coins.');
    }

    await this.databaseService.query(
      `
        UPDATE users
        SET balance = balance - $2
        WHERE id = $1
      `,
      [userId, item.price],
    );

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
    let profile = await this.ensureMascotProfile(userId);

    if (!profile.owned_item_ids.includes(itemId)) {
      if (item.price > 0) {
        throw new BadRequestException('Mascot item is not owned.');
      }

      profile = await this.addOwnedItem(userId, itemId);
    }

    const updatedProfile = await this.databaseService.query<MascotProfileRow>(
      `
        UPDATE user_mascot_profiles
        SET ${this.getEquippedColumn(item.slot)} = $2,
            ${this.getLegacyClearAssignments(item.slot)},
            updated_at = now()
        WHERE user_id = $1
        RETURNING equipped_glasses_id,
                  equipped_hat_id,
                  equipped_bandana_id,
                  equipped_eye_patch_id,
                  equipped_head_item_id,
                  equipped_eyes_item_id,
                  owned_item_ids
      `,
      [userId, itemId],
    );

    return this.mapProfileRow(userId, updatedProfile.rows[0]);
  }

  async clearSlot(
    userId: string,
    slot: MascotAccessorySlot,
  ): Promise<MascotProfileResponse> {
    await this.ensureUserExists(userId);
    await this.ensureMascotProfile(userId);
    this.assertValidSlot(slot);

    const updatedProfile = await this.databaseService.query<MascotProfileRow>(
      `
        UPDATE user_mascot_profiles
        SET ${this.getEquippedColumn(slot)} = NULL,
            ${this.getLegacyClearAssignments(slot)},
            updated_at = now()
        WHERE user_id = $1
        RETURNING equipped_glasses_id,
                  equipped_hat_id,
                  equipped_bandana_id,
                  equipped_eye_patch_id,
                  equipped_head_item_id,
                  equipped_eyes_item_id,
                  owned_item_ids
      `,
      [userId],
    );

    return this.mapProfileRow(userId, updatedProfile.rows[0]);
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const result = await this.databaseService.query(
      `
        SELECT id
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('User not found.');
    }
  }

  private async ensureMascotProfile(userId: string): Promise<MascotProfileRow> {
    const result = await this.databaseService.query<MascotProfileRow>(
      `
        INSERT INTO user_mascot_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO UPDATE
        SET updated_at = user_mascot_profiles.updated_at
        RETURNING equipped_glasses_id,
                  equipped_hat_id,
                  equipped_bandana_id,
                  equipped_eye_patch_id,
                  equipped_head_item_id,
                  equipped_eyes_item_id,
                  owned_item_ids
      `,
      [userId],
    );

    return result.rows[0];
  }

  private async addOwnedItem(
    userId: string,
    itemId: string,
  ): Promise<MascotProfileRow> {
    const result = await this.databaseService.query<MascotProfileRow>(
      `
        UPDATE user_mascot_profiles
        SET owned_item_ids = array_append(owned_item_ids, $2),
            updated_at = now()
        WHERE user_id = $1
          AND NOT ($2 = ANY(owned_item_ids))
        RETURNING equipped_glasses_id,
                  equipped_hat_id,
                  equipped_bandana_id,
                  equipped_eye_patch_id,
                  equipped_head_item_id,
                  equipped_eyes_item_id,
                  owned_item_ids
      `,
      [userId, itemId],
    );

    return result.rows[0] ?? this.ensureMascotProfile(userId);
  }

  private getEquippedColumn(slot: MascotAccessorySlot): string {
    const columns: Record<MascotAccessorySlot, string> = {
      eyes: 'equipped_eyes_item_id',
      head: 'equipped_head_item_id',
    };

    return columns[slot];
  }

  private getLegacyClearAssignments(slot: MascotAccessorySlot): string {
    const assignments: Record<MascotAccessorySlot, string> = {
      eyes: 'equipped_glasses_id = NULL, equipped_eye_patch_id = NULL',
      head: 'equipped_hat_id = NULL, equipped_bandana_id = NULL',
    };

    return assignments[slot];
  }

  private assertValidSlot(slot: MascotAccessorySlot): void {
    const validSlots: MascotAccessorySlot[] = ['eyes', 'head'];

    if (!validSlots.includes(slot)) {
      throw new BadRequestException('Unknown mascot slot.');
    }
  }

  private mapProfileRow(
    userId: string,
    row: MascotProfileRow,
  ): MascotProfileResponse {
    return {
      equippedItems: {
        eyes:
          row.equipped_eyes_item_id ??
          row.equipped_glasses_id ??
          row.equipped_eye_patch_id ??
          undefined,
        head:
          row.equipped_head_item_id ??
          row.equipped_hat_id ??
          row.equipped_bandana_id ??
          undefined,
      },
      ownedItemIds: row.owned_item_ids,
      userId,
    };
  }
}
