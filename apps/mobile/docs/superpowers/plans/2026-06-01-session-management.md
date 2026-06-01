# Session Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store the refresh token from login, auto-refresh the access token before it expires (15-minute TTL), and prevent the WebSocket from infinitely retrying with a dead token.

**Architecture:** `AuthContext` becomes the single source of truth for both tokens and exposes a `getValidToken()` async method that callers use instead of the raw `token` value — it transparently refreshes when needed. The auth flow routes pass the refresh token through params. `useChatRoom` calls `getValidToken()` before each connection attempt rather than holding a stale copy.

**Tech Stack:** React Native 0.81 / Expo SDK 54, AsyncStorage, `atob` (available in RN 0.73+), Expo Router v6.

---

## File Map

| File | Change |
|---|---|
| `context/AuthContext.tsx` | Add `refreshToken` state + storage; update `login()` signature; add `getValidToken()` |
| `lib/api.ts` | Add `refreshTokens(refreshToken)` API function |
| `features/auth/screens/OtpScreen.tsx` | Add `refreshToken` to `onSuccess` callback signature |
| `app/auth/otp.tsx` | Pass `refreshToken` to `login()` and to complete-profile route params |
| `app/auth/complete-profile.tsx` | Accept `refreshToken` route param; pass to `login()` |
| `features/chat/hooks/useChatRoom.ts` | Call `getValidToken()` before connecting; stop retrying on auth failure |

---

### Task 1: Add `refreshToken` to `AuthContext`

**Files:**
- Modify: `context/AuthContext.tsx`

- [ ] **Step 1: Update `AuthContextType`, storage keys, and state**

Replace the entire file with:

```typescript
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
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
    const padded = payload + '=='.slice(0, (4 - (payload.length % 4)) % 4);
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

  const getValidToken = useCallback(async (): Promise<string> => {
    if (!token || !storedRefreshToken) throw new Error('Not authenticated');

    const exp = getTokenExp(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Refresh proactively if less than 60 seconds remain
    if (exp !== null && exp - nowSeconds > 60) return token;

    // Token is expired or expiring soon — refresh
    const result = await refreshTokens(storedRefreshToken);
    setToken(result.accessToken);
    setStoredRefreshToken(result.refreshToken);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
    ]);
    return result.accessToken;
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
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep -i "AuthContext\|auth_context" | head -20
```

Expected: errors about call sites that still pass `login(user, token)` with 2 args — those get fixed in Tasks 3 and 4.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/context/AuthContext.tsx
git commit -m "feat(mobile): store refresh token in AuthContext, add getValidToken()"
```

---

### Task 2: Add `refreshTokens` to the API client

**Files:**
- Modify: `lib/api.ts`

- [ ] **Step 1: Add the `refreshTokens` function**

Add after the `verifyOtp` function (after line 44):

```typescript
export async function refreshTokens(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; user: VerifiedUser }> {
  return post('/auth/refresh', { refreshToken });
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep "api.ts" | head -10
```

Expected: no errors in `api.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/api.ts
git commit -m "feat(mobile): add refreshTokens API function"
```

---

### Task 3: Thread `refreshToken` through the login flow

The login flow has two paths:
- **Direct login** (profile already complete): `OtpScreen` → `app/auth/otp.tsx` → `login(user, accessToken, refreshToken)`
- **New user** (profile incomplete): `OtpScreen` → `app/auth/otp.tsx` → router pushes to `complete-profile` → `app/auth/complete-profile.tsx` → `login(user, accessToken, refreshToken)`

**Files:**
- Modify: `features/auth/screens/OtpScreen.tsx`
- Modify: `app/auth/otp.tsx`
- Modify: `app/auth/complete-profile.tsx`

- [ ] **Step 1: Update `OtpScreen` props to include `refreshToken`**

In `features/auth/screens/OtpScreen.tsx`, change lines 8–12:

```typescript
interface OtpScreenProps {
  email: string;
  onSuccess: (user: VerifiedUser, accessToken: string, refreshToken: string) => void;
  onBack: () => void;
}
```

And change line 36–37:

```typescript
      const { accessToken, refreshToken, user } = await verifyOtp(email, otp);
      onSuccess(user, accessToken, refreshToken);
```

- [ ] **Step 2: Update `app/auth/otp.tsx` to use refreshToken**

Replace the entire file:

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { OtpScreen } from '@/features/auth/screens/OtpScreen';
import { useAuth } from '@/context/AuthContext';

export default function OtpRoute() {
  const router = useRouter();
  const { login } = useAuth();
  const { email, returnTo } = useLocalSearchParams<{ email: string; returnTo?: string }>();

  return (
    <OtpScreen
      email={email ?? ''}
      onSuccess={(user, accessToken, refreshToken) => {
        if (!user.profileCompleted) {
          router.push({
            pathname: '/auth/complete-profile',
            params: { accessToken, refreshToken, email: user.email, returnTo: returnTo ?? '' },
          });
        } else {
          login(user, accessToken, refreshToken);
          router.replace((returnTo as any) || '/(tabs)');
        }
      }}
      onBack={() => router.back()}
    />
  );
}
```

- [ ] **Step 3: Update `app/auth/complete-profile.tsx` to accept and pass refreshToken**

Replace the entire file:

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';
import { useAuth } from '@/context/AuthContext';
import type { VerifiedUser } from '@/lib/api';

export default function CompleteProfileRoute() {
  const router = useRouter();
  const { login } = useAuth();
  const { email, accessToken, refreshToken, returnTo } = useLocalSearchParams<{
    email: string;
    accessToken: string;
    refreshToken: string;
    returnTo?: string;
  }>();

  if (!accessToken || !refreshToken) {
    router.replace('/auth');
    return null;
  }

  const handleSubmit = (user: VerifiedUser) => {
    login(user, accessToken, refreshToken);
    router.push({ pathname: '/auth/success', params: { returnTo: returnTo ?? '' } });
  };

  return (
    <CompleteProfileScreen
      email={email ?? ''}
      token={accessToken}
      onSubmit={handleSubmit}
    />
  );
}
```

- [ ] **Step 4: Type-check the full project**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors related to the auth flow files.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/features/auth/screens/OtpScreen.tsx \
        apps/mobile/app/auth/otp.tsx \
        apps/mobile/app/auth/complete-profile.tsx
git commit -m "feat(mobile): thread refreshToken through OTP and complete-profile login flow"
```

---

### Task 4: Use `getValidToken` in `useChatRoom`

**Files:**
- Modify: `features/chat/hooks/useChatRoom.ts`

- [ ] **Step 1: Rewrite `useChatRoom` to use `getValidToken` and stop retrying on auth failure**

Replace the entire file:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Message } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
const WS_BASE = BASE.replace(/^http/, 'ws');

export type ChatStatus = 'connecting' | 'connected' | 'disconnected' | 'auth_error';

export function useChatRoom(conversationId: string) {
  const { getValidToken, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authFailedRef = useRef(false);

  const connect = useCallback(async () => {
    if (authFailedRef.current) return;

    let freshToken: string;
    try {
      freshToken = await getValidToken();
    } catch {
      // Refresh failed — session is dead
      authFailedRef.current = true;
      setStatus('auth_error');
      logout();
      return;
    }

    const url = `${WS_BASE}/chat/conversations/${conversationId}/ws?token=${freshToken}`;
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data as string);
      if (event.type === 'history') {
        setMessages((event.messages as any[]).map(normalizeMessage));
      } else if (event.type === 'message') {
        setMessages((prev) => [...prev, normalizeMessage(event)]);
      }
    };

    ws.onclose = (e) => {
      setStatus('disconnected');
      if (e.code !== 1000 && !authFailedRef.current) {
        // Retry, but get a fresh token each time (handles expiry during a long session)
        retryRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [conversationId, getValidToken, logout]);

  useEffect(() => {
    authFailedRef.current = false;
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);

  const send = useCallback((text: string, imageUrl?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', text, imageUrl: imageUrl ?? null }));
    }
  }, []);

  return { messages, status, send };
}

function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    text: raw.text ?? undefined,
    image: raw.imageUrl ?? undefined,
    timestamp: new Date(raw.createdAt),
    isRead: !!raw.readAt,
  };
}
```

- [ ] **Step 2: Check if `ChatRoomScreen` uses `status` and update if needed**

```bash
grep -n "status\|ChatStatus" /Users/riaenriala/Desktop/thenightshift/bantujual/apps/mobile/features/chat/ChatRoomScreen.tsx
```

If `ChatRoomScreen` checks `status === 'disconnected'`, also check for `'auth_error'` to show an appropriate message to the user.

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/chat/hooks/useChatRoom.ts
git commit -m "fix(mobile): use getValidToken in useChatRoom, stop retrying on auth failure"
```

---

## Verification

After all tasks:

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: zero errors.

Manual test:
1. Login with OTP → verify AsyncStorage has `auth_refresh_token`
2. Wait 15 min (or temporarily set `ACCESS_TOKEN_TTL=10` in `.dev.vars`) → open chat → WebSocket should connect successfully after auto-refresh
3. Use an invalid refresh token → app should call `logout()` and return to auth screen
