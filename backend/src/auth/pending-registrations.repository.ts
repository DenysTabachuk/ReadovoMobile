import { Injectable } from '@nestjs/common';

import { type PendingUserRegistration as PendingUserRegistrationModel } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type PendingUserRegistration } from './types';

@Injectable()
export class PendingRegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    registration: PendingUserRegistration,
  ): Promise<PendingUserRegistration> {
    const created = await this.prisma.pendingUserRegistration.create({
      data: {
        ...registration,
        createdAt: new Date(registration.createdAt),
        verificationExpiresAt: new Date(registration.verificationExpiresAt),
      },
    });

    return this.toPendingUserRegistration(created);
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.prisma.pendingUserRegistration.deleteMany({ where: { email } });
  }

  async findByEmail(
    email: string,
  ): Promise<PendingUserRegistration | undefined> {
    const registration = await this.prisma.pendingUserRegistration.findUnique({
      where: { email },
    });

    return registration
      ? this.toPendingUserRegistration(registration)
      : undefined;
  }

  async updateVerificationCode(
    email: string,
    verificationCodeHash: string,
    verificationCodeSalt: string,
    verificationExpiresAt: string,
  ): Promise<void> {
    await this.prisma.pendingUserRegistration.updateMany({
      data: {
        verificationCodeHash,
        verificationCodeSalt,
        verificationExpiresAt: new Date(verificationExpiresAt),
      },
      where: { email },
    });
  }

  private toPendingUserRegistration(
    registration: PendingUserRegistrationModel,
  ): PendingUserRegistration {
    return {
      createdAt: registration.createdAt.toISOString(),
      email: registration.email,
      id: registration.id,
      passwordHash: registration.passwordHash,
      passwordSalt: registration.passwordSalt,
      verificationCodeHash: registration.verificationCodeHash,
      verificationCodeSalt: registration.verificationCodeSalt,
      verificationExpiresAt: registration.verificationExpiresAt.toISOString(),
    };
  }
}
