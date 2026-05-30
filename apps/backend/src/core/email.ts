import { Resend } from 'resend';
import { env } from './env';

export interface EmailService {
  sendOtp(email: string, code: string): Promise<void>;
}

// --- Test double: records what would have been sent ---
export const sentOtps: { email: string; code: string }[] = [];

export class TestEmailService implements EmailService {
  async sendOtp(email: string, code: string): Promise<void> {
    sentOtps.push({ email, code });
  }
}

// --- Dev double: logs to the console ---
export class ConsoleEmailService implements EmailService {
  async sendOtp(email: string, code: string): Promise<void> {
    console.log(`[email] OTP for ${email}: ${code}`);
  }
}

// --- Production: sends via Resend ---
export class ResendEmailService implements EmailService {
  private resend = new Resend(env.RESEND_API_KEY);
  async sendOtp(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Kode masuk BantuJual',
      text: `Kode verifikasi kamu: ${code}. Berlaku ${Math.floor(env.OTP_TTL / 60)} menit.`,
    });
  }
}

function pickEmailService(): EmailService {
  if (env.NODE_ENV === 'test') return new TestEmailService();
  if (env.RESEND_API_KEY) return new ResendEmailService();
  return new ConsoleEmailService();
}

export const emailService: EmailService = pickEmailService();
