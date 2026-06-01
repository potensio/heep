import { describe, it, expect } from 'vitest';
import { hashOtpCode, verifyOtpCode, generateOtpCode, hashRefreshToken } from './crypto';

describe('crypto', () => {
  it('verifyOtpCode returns true for correct code', async () => {
    const code = '123456';
    const hash = await hashOtpCode(code);
    expect(await verifyOtpCode(code, hash)).toBe(true);
  });

  it('verifyOtpCode returns false for wrong code', async () => {
    const hash = await hashOtpCode('123456');
    expect(await verifyOtpCode('000000', hash)).toBe(false);
  });

  it('generateOtpCode returns a 6-digit string', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('hashRefreshToken is deterministic', async () => {
    const h1 = await hashRefreshToken('abc');
    const h2 = await hashRefreshToken('abc');
    expect(h1).toBe(h2);
  });

  it('hashRefreshToken differs for different inputs', async () => {
    expect(await hashRefreshToken('a')).not.toBe(await hashRefreshToken('b'));
  });
});
