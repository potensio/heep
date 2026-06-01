import { describe, it, expect } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  const valid = {
    DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  it('applies defaults for optional vars', () => {
    const env = parseEnv(valid);
    expect(env.ACCESS_TOKEN_TTL).toBe(900);
    expect(env.OTP_TTL).toBe(300);
  });

  it('throws when a required var is missing', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow();
  });

  it('coerces numeric strings', () => {
    const env = parseEnv({ ...valid, ACCESS_TOKEN_TTL: '1800' });
    expect(env.ACCESS_TOKEN_TTL).toBe(1800);
  });
});
