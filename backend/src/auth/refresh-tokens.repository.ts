import { Injectable } from '@nestjs/common';

import { type UserRefreshToken } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type RefreshTokenRecord } from './types';

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(record: RefreshTokenRecord): Promise<void> {
    await this.prisma.userRefreshToken.create({
      data: {
        ...record,
        createdAt: new Date(record.createdAt),
        expiresAt: new Date(record.expiresAt),
        revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<RefreshTokenRecord[]> {
    const rows = await this.prisma.userRefreshToken.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null,
        userId,
      },
    });

    return rows.map((row) => this.toRefreshTokenRecord(row));
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.userRefreshToken.updateMany({
      data: { revokedAt: new Date() },
      where: { id },
    });
  }

  private toRefreshTokenRecord(row: UserRefreshToken): RefreshTokenRecord {
    return {
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      id: row.id,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      tokenHash: row.tokenHash,
      tokenSalt: row.tokenSalt,
      userId: row.userId,
    };
  }
}
