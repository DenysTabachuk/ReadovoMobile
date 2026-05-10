import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type StoredUser } from './types';

type UserRow = {
  balance: number;
  created_at: Date;
  email: string;
  id: string;
  lessons_completed: number;
  password_hash: string;
  password_salt: string;
  tests_completed: number;
  words_learned: number;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT id, email, password_hash, password_salt, created_at
             , lessons_completed, tests_completed, words_learned, balance
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
        INSERT INTO users (
          id,
          email,
          password_hash,
          password_salt,
          lessons_completed,
          tests_completed,
          words_learned,
          balance,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, email, password_hash, password_salt, created_at,
                  lessons_completed, tests_completed, words_learned, balance
      `,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.passwordSalt,
        user.lessonsCompleted,
        user.testsCompleted,
        user.wordsLearned,
        user.balance,
        user.createdAt,
      ],
    );

    return this.toStoredUser(result.rows[0]);
  }

  async updatePassword(
    email: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE users
        SET password_hash = $2,
            password_salt = $3
        WHERE email = $1
      `,
      [email, passwordHash, passwordSalt],
    );
  }

  private toStoredUser(user: UserRow): StoredUser {
    return {
      createdAt: user.created_at.toISOString(),
      email: user.email,
      id: user.id,
      lessonsCompleted: user.lessons_completed,
      passwordHash: user.password_hash,
      passwordSalt: user.password_salt,
      testsCompleted: user.tests_completed,
      wordsLearned: user.words_learned,
      balance: user.balance,
    };
  }
}
