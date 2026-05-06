import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type PendingUserRegistration } from './types';

type PendingRegistrationRow = {
  created_at: Date;
  email: string;
  id: string;
  password_hash: string;
  password_salt: string;
  verification_code_hash: string;
  verification_code_salt: string;
  verification_expires_at: Date;
};

@Injectable()
export class PendingRegistrationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    registration: PendingUserRegistration,
  ): Promise<PendingUserRegistration> {
    const result = await this.databaseService.query<PendingRegistrationRow>(
      `
        INSERT INTO pending_user_registrations (
          id,
          email,
          password_hash,
          password_salt,
          verification_code_hash,
          verification_code_salt,
          verification_expires_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, password_hash, password_salt,
                  verification_code_hash, verification_code_salt,
                  verification_expires_at, created_at
      `,
      [
        registration.id,
        registration.email,
        registration.passwordHash,
        registration.passwordSalt,
        registration.verificationCodeHash,
        registration.verificationCodeSalt,
        registration.verificationExpiresAt,
        registration.createdAt,
      ],
    );

    return this.toPendingUserRegistration(result.rows[0]);
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM pending_user_registrations
        WHERE email = $1
      `,
      [email],
    );
  }

  async findByEmail(
    email: string,
  ): Promise<PendingUserRegistration | undefined> {
    const result = await this.databaseService.query<PendingRegistrationRow>(
      `
        SELECT id, email, password_hash, password_salt,
               verification_code_hash, verification_code_salt,
               verification_expires_at, created_at
        FROM pending_user_registrations
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    const registration = result.rows[0];

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
    await this.databaseService.query(
      `
        UPDATE pending_user_registrations
        SET verification_code_hash = $2,
            verification_code_salt = $3,
            verification_expires_at = $4
        WHERE email = $1
      `,
      [
        email,
        verificationCodeHash,
        verificationCodeSalt,
        verificationExpiresAt,
      ],
    );
  }

  private toPendingUserRegistration(
    registration: PendingRegistrationRow,
  ): PendingUserRegistration {
    return {
      createdAt: registration.created_at.toISOString(),
      email: registration.email,
      id: registration.id,
      passwordHash: registration.password_hash,
      passwordSalt: registration.password_salt,
      verificationCodeHash: registration.verification_code_hash,
      verificationCodeSalt: registration.verification_code_salt,
      verificationExpiresAt: registration.verification_expires_at.toISOString(),
    };
  }
}
