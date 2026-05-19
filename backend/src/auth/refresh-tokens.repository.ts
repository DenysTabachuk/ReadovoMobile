import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type RefreshTokenRecord } from './types';

type RefreshTokenRow = {
  created_at: Date;
  expires_at: Date;
  id: string;
  revoked_at: Date | null;
  token_hash: string;
  token_salt: string;
  user_id: string;
};

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(record: RefreshTokenRecord): Promise<void> {
    await this.databaseService.query(
      `
        INSERT INTO user_refresh_tokens (
          id,
          user_id,
          token_hash,
          token_salt,
          expires_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        record.id,
        record.userId,
        record.tokenHash,
        record.tokenSalt,
        record.expiresAt,
        record.createdAt,
      ],
    );
  }

  async findActiveByUserId(userId: string): Promise<RefreshTokenRecord[]> {
    const result = await this.databaseService.query<RefreshTokenRow>(
      `
        SELECT id, user_id, token_hash, token_salt, expires_at, created_at, revoked_at
        FROM user_refresh_tokens
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > now()
        ORDER BY created_at DESC
      `,
      [userId],
    );

    return result.rows.map((row) => this.toRefreshTokenRecord(row));
  }

  async revoke(id: string): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE user_refresh_tokens
        SET revoked_at = now()
        WHERE id = $1
      `,
      [id],
    );
  }

  private toRefreshTokenRecord(row: RefreshTokenRow): RefreshTokenRecord {
    return {
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
      id: row.id,
      revokedAt: row.revoked_at?.toISOString() ?? null,
      tokenHash: row.token_hash,
      tokenSalt: row.token_salt,
      userId: row.user_id,
    };
  }
}
