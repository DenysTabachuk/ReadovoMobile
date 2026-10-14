import { Injectable } from '@nestjs/common';

import { type PasswordResetRequest as PasswordResetRequestModel } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type PasswordResetRequest } from './types';

@Injectable()
export class PasswordResetRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(request: PasswordResetRequest): Promise<PasswordResetRequest> {
    const data = {
      ...request,
      createdAt: new Date(request.createdAt),
      resetTokenExpiresAt: request.resetTokenExpiresAt
        ? new Date(request.resetTokenExpiresAt)
        : null,
      verificationExpiresAt: new Date(request.verificationExpiresAt),
    };
    const saved = await this.prisma.passwordResetRequest.upsert({
      create: data,
      update: {
        ...data,
        resetTokenExpiresAt: null,
        resetTokenHash: null,
        resetTokenSalt: null,
      },
      where: { email: request.email },
    });

    return this.toPasswordResetRequest(saved);
  }

  async findByEmail(email: string): Promise<PasswordResetRequest | undefined> {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { email },
    });

    return request ? this.toPasswordResetRequest(request) : undefined;
  }

  async updateResetToken(
    email: string,
    resetTokenHash: string,
    resetTokenSalt: string,
    resetTokenExpiresAt: string,
  ): Promise<void> {
    await this.prisma.passwordResetRequest.updateMany({
      data: {
        resetTokenExpiresAt: new Date(resetTokenExpiresAt),
        resetTokenHash,
        resetTokenSalt,
      },
      where: { email },
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.prisma.passwordResetRequest.deleteMany({ where: { email } });
  }

  private toPasswordResetRequest(
    request: PasswordResetRequestModel,
  ): PasswordResetRequest {
    return {
      createdAt: request.createdAt.toISOString(),
      email: request.email,
      id: request.id,
      resetTokenExpiresAt: request.resetTokenExpiresAt?.toISOString() ?? null,
      resetTokenHash: request.resetTokenHash,
      resetTokenSalt: request.resetTokenSalt,
      verificationCodeHash: request.verificationCodeHash,
      verificationCodeSalt: request.verificationCodeSalt,
      verificationExpiresAt: request.verificationExpiresAt.toISOString(),
    };
  }
}
