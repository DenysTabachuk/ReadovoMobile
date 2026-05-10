import { Injectable, Logger } from '@nestjs/common';
import {
  pbkdf2Sync,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import { createTransport } from 'nodemailer';

const codeTtlMinutes = 15;
const defaultSmtpPort = 587;

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  createVerificationCode(): {
    code: string;
    expiresAt: string;
    hash: string;
    salt: string;
  } {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const salt = randomBytes(16).toString('hex');

    return {
      code,
      expiresAt: new Date(
        Date.now() + codeTtlMinutes * 60 * 1000,
      ).toISOString(),
      hash: this.hashCode(code, salt),
      salt,
    };
  }

  isCodeValid(code: string, hash: string, salt: string): boolean {
    const expectedHash = Buffer.from(hash, 'hex');
    const actualHash = Buffer.from(this.hashCode(code, salt), 'hex');

    return (
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash)
    );
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.sendCode({
      code,
      email,
      subject: 'Readovo email verification code',
      text: `Your Readovo verification code is ${code}. It expires in ${codeTtlMinutes} minutes.`,
    });
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    await this.sendCode({
      code,
      email,
      subject: 'Readovo password reset code',
      text: `Your Readovo password reset code is ${code}. It expires in ${codeTtlMinutes} minutes.`,
    });
  }

  private async sendCode({
    code,
    email,
    subject,
    text,
  }: {
    code: string;
    email: string;
    subject: string;
    text: string;
  }): Promise<void> {
    const host = process.env.SMTP_HOST;
    const password = process.env.SMTP_PASSWORD;
    const port = Number(process.env.SMTP_PORT ?? defaultSmtpPort);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const from = process.env.EMAIL_FROM;

    if (!host || !password || !user || !from) {
      this.logger.warn(
        `SMTP is not configured. Email code for ${email}: ${code}`,
      );
      return;
    }

    const transporter = createTransport({
      auth: {
        pass: password,
        user,
      },
      host,
      port,
      secure,
    });

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
      });
    } catch (error) {
      this.logger.error(`Failed to send email code to ${email}`, error);
      throw new Error('Could not send email code.');
    }
  }

  private hashCode(code: string, salt: string): string {
    return pbkdf2Sync(code, salt, 100_000, 64, 'sha512').toString('hex');
  }
}
