import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type StoredUser } from './types';

type UserRow = {
  created_at: Date;
  email: string;
  id: string;
  password_hash: string;
  password_salt: string;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT id, email, password_hash, password_salt, created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    const user = result.rows[0];

    return user ? this.toStoredUser(user) : undefined;
  }

  async create(user: StoredUser): Promise<StoredUser> {
    const result = await this.databaseService.query<UserRow>(
      `
        INSERT INTO users (id, email, password_hash, password_salt, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, password_hash, password_salt, created_at
      `,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.passwordSalt,
        user.createdAt,
      ],
    );

    return this.toStoredUser(result.rows[0]);
  }

  private toStoredUser(user: UserRow): StoredUser {
    return {
      createdAt: user.created_at.toISOString(),
      email: user.email,
      id: user.id,
      passwordHash: user.password_hash,
      passwordSalt: user.password_salt,
    };
  }
}
