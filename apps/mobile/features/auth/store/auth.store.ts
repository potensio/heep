import { storage } from '@/lib/storage';

const KEYS = {
  ACCESS_TOKEN: 'auth.access_token',
  REFRESH_TOKEN: 'auth.refresh_token',
} as const;

export function saveTokens(accessToken: string, refreshToken: string): void {
  storage.set(KEYS.ACCESS_TOKEN, accessToken);
  storage.set(KEYS.REFRESH_TOKEN, refreshToken);
}

export function clearTokens(): void {
  storage.delete(KEYS.ACCESS_TOKEN);
  storage.delete(KEYS.REFRESH_TOKEN);
}

export function getAccessToken(): string | undefined {
  return storage.getString(KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | undefined {
  return storage.getString(KEYS.REFRESH_TOKEN);
}

export { KEYS as AUTH_STORAGE_KEYS };
