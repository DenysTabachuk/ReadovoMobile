import { Injectable } from '@nestjs/common';

import { type User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type StoredUser } from './types';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    return user ? this.toStoredUser(user) : undefined;
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    return user ? this.toStoredUser(user) : undefined;
  }

  async create(user: StoredUser): Promise<StoredUser> {
    const created = await this.prisma.user.create({
      data: {
        ...user,
        createdAt: new Date(user.createdAt),
      },
    });

    return this.toStoredUser(created);
  }

  async updatePassword(
    email: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<void> {
    await this.prisma.user.updateMany({
      data: { passwordHash, passwordSalt },
      where: { email },
    });
  }

  private toStoredUser(user: User): StoredUser {
    return {
      createdAt: user.createdAt.toISOString(),
      email: user.email,
      id: user.id,
      lessonsCompleted: user.lessonsCompleted,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      testsCompleted: user.testsCompleted,
      wordsLearned: user.wordsLearned,
      balance: user.balance,
    };
  }
}
