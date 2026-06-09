import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '../api/auth.api';
import { refreshTokensApi } from '../api/auth.api';

const KEYS = {
  ACCESS_TOKEN: 'auth.access_token',
  REFRESH_TOKEN: 'auth.refresh_token',
  USER: 'auth.user',
} as const;

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEYS.ACCESS_TOKEN, accessToken),
    AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(KEYS.USER),
  ]);
}

export function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
}

export async function saveUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function getBubbleToken(): Promise<string | null> {
  const user = await getStoredUser();
  return user?.bubble_token ?? null;
}

export async function tryRefreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const tokens = await refreshTokensApi(refreshToken);
    await Promise.all([saveTokens(tokens.accessToken, tokens.refreshToken), saveUser(tokens.user)]);
    return tokens.accessToken;
  } catch {
    return null;
  }
}
