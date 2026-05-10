import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type PasswordResetRequest } from './types';

type PasswordResetRequestRow = {
  created_at: Date;
  email: string;
  id: string;
  reset_token_expires_at: Date | null;
  reset_token_hash: string | null;
  reset_token_salt: string | null;
  verification_code_hash: string;
  verification_code_salt: string;
  verification_expires_at: Date;
};

@Injectable()
export class PasswordResetRequestsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async upsert(request: PasswordResetRequest): Promise<PasswordResetRequest> {
    const result = await this.databaseService.query<PasswordResetRequestRow>(
      `
        INSERT INTO password_reset_requests (
          id,
          email,
          verification_code_hash,
          verification_code_salt,
          verification_expires_at,
          reset_token_hash,
          reset_token_salt,
          reset_token_expires_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (email) DO UPDATE SET
          id = EXCLUDED.id,
          verification_code_hash = EXCLUDED.verification_code_hash,
          verification_code_salt = EXCLUDED.verification_code_salt,
          verification_expires_at = EXCLUDED.verification_expires_at,
          reset_token_hash = NULL,
          reset_token_salt = NULL,
          reset_token_expires_at = NULL,
          created_at = EXCLUDED.created_at
        RETURNING id, email, verification_code_hash, verification_code_salt,
                  verification_expires_at, reset_token_hash, reset_token_salt,
                  reset_token_expires_at, created_at
      `,
      [
        request.id,
        request.email,
        request.verificationCodeHash,
        request.verificationCodeSalt,
        request.verificationExpiresAt,
        request.resetTokenHash,
        request.resetTokenSalt,
        request.resetTokenExpiresAt,
        request.createdAt,
      ],
    );

    return this.toPasswordResetRequest(result.rows[0]);
  }

  async findByEmail(email: string): Promise<PasswordResetRequest | undefined> {
    const result = await this.databaseService.query<PasswordResetRequestRow>(
      `
        SELECT id, email, verification_code_hash, verification_code_salt,
               verification_expires_at, reset_token_hash, reset_token_salt,
               reset_token_expires_at, created_at
        FROM password_reset_requests
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    const request = result.rows[0];

    return request ? this.toPasswordResetRequest(request) : undefined;
  }

  async updateResetToken(
    email: string,
    resetTokenHash: string,
    resetTokenSalt: string,
    resetTokenExpiresAt: string,
  ): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE password_reset_requests
        SET reset_token_hash = $2,
            reset_token_salt = $3,
            reset_token_expires_at = $4
        WHERE email = $1
      `,
      [email, resetTokenHash, resetTokenSalt, resetTokenExpiresAt],
    );
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM password_reset_requests
        WHERE email = $1
      `,
      [email],
    );
  }

  private toPasswordResetRequest(
    request: PasswordResetRequestRow,
  ): PasswordResetRequest {
    return {
      createdAt: request.created_at.toISOString(),
      email: request.email,
      id: request.id,
      resetTokenExpiresAt:
        request.reset_token_expires_at?.toISOString() ?? null,
      resetTokenHash: request.reset_token_hash,
      resetTokenSalt: request.reset_token_salt,
      verificationCodeHash: request.verification_code_hash,
      verificationCodeSalt: request.verification_code_salt,
      verificationExpiresAt: request.verification_expires_at.toISOString(),
    };
  }
}
