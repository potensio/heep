// TODO(Task 6): env singleton removed; env values will be injected via deps.
import { Resend } from 'resend';

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
// TODO(Task 6): inject apiKey, emailFrom, otpTtl via constructor/deps
export class ResendEmailService implements EmailService {
  private resend: Resend;
  private emailFrom: string;
  private otpTtlMinutes: number;

  constructor(apiKey: string, emailFrom: string, otpTtlSeconds: number) {
    this.resend = new Resend(apiKey);
    this.emailFrom = emailFrom;
    this.otpTtlMinutes = Math.floor(otpTtlSeconds / 60);
  }

  async sendOtp(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: this.emailFrom,
      to: email,
      subject: 'Kode masuk BantuJual',
      text: `Kode verifikasi kamu: ${code}. Berlaku ${this.otpTtlMinutes} menit.`,
    });
  }
}

// TODO(Task 6): replace with factory that accepts ParsedEnv; remove module-level singleton
export const emailService: EmailService = new ConsoleEmailService();
