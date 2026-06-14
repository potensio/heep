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

export async function getTeamId(): Promise<string | null> {
  const user = await getStoredUser();
  return user?.team_id ?? null;
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

const TOKEN_EXPIRY_SKEW_MS = 30_000;

/** Reads the `exp` claim from a JWT without verifying it. Returns null if unreadable. */
function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(normalized) : null;
    if (!json) return null;
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

/**
 * Returns a usable access token, refreshing first if the stored one is missing
 * or about to expire. Pass `forceRefresh` to skip the cached token entirely —
 * use this after a connection was rejected with a token that looked valid.
 *
 * Unknown expiry (e.g. `atob` unavailable) is treated as still-valid so we
 * don't refresh on every call; the caller's reactive `forceRefresh` path
 * recovers if the server actually rejects it.
 */
export async function getFreshAccessToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const token = await getAccessToken();
    if (token) {
      const exp = decodeJwtExp(token);
      if (exp === null || exp * 1000 - Date.now() > TOKEN_EXPIRY_SKEW_MS) return token;
    }
  }
  return tryRefreshTokens();
}
