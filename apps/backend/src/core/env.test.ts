import { describe, it, expect } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  const valid = {
    DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    BUBBLE_API_URL: 'https://app.heep.ai/version-test',
    BUBBLE_API_KEY: 'test-key',
  };

  it('applies defaults for optional vars', () => {
    const env = parseEnv(valid);
    expect(env.ACCESS_TOKEN_TTL).toBe(900);
    expect(env.REFRESH_TOKEN_TTL).toBe(2592000);
  });

  it('throws when a required var is missing', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow();
  });

  it('coerces numeric strings', () => {
    const env = parseEnv({ ...valid, ACCESS_TOKEN_TTL: '1800' });
    expect(env.ACCESS_TOKEN_TTL).toBe(1800);
  });
});
