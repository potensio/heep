import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location } from '@/lib/types';
import { refreshTokens } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
  avatarUrl: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => Promise<void>;
  getValidToken: () => Promise<string>;
}

const STORAGE_KEYS = {
  USER: 'auth_user',
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

function getTokenExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [storedRefreshToken, setStoredRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    async function hydrate() {
      try {
        const [storedUser, storedToken, storedRefresh] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        ]);
        if (storedUser && storedToken && storedRefresh) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setStoredRefreshToken(storedRefresh);
        }
      } catch {
        // ignore — treat as unauthenticated
      } finally {
        setIsLoading(false);
      }
    }
    hydrate();
  }, []);

  const login = useCallback(async (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData);
    setToken(accessToken);
    setStoredRefreshToken(refreshToken);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData)),
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setStoredRefreshToken(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, []);

  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const getValidToken = useCallback(async (): Promise<string> => {
    if (!token || !storedRefreshToken) throw new Error('Not authenticated');
    const exp = getTokenExp(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp !== null && exp - nowSeconds > 60) return token;

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshTokens(storedRefreshToken)
        .then((result: { accessToken: string; refreshToken: string }) => {
          setToken(result.accessToken);
          setStoredRefreshToken(result.refreshToken);
          return Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.accessToken),
            AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
          ]).then(() => result.accessToken);
        })
        .finally(() => { refreshPromiseRef.current = null; });
    }
    return refreshPromiseRef.current!;
  }, [token, storedRefreshToken]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, isLoading, login, logout, updateUser, getValidToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
