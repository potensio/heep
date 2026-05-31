# Mobile Auth Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the mobile app's email-OTP auth screens to the real backend API so a user can register/log in against a live Postgres database.

**Architecture:** A new `lib/api.ts` module exposes two typed async functions (`requestOtp`, `verifyOtp`). The route wrapper `app/auth/otp.tsx` owns `AuthContext` — it receives the verified user + token from `OtpScreen` via an `onSuccess` callback and calls `login()`. Feature screens stay context-free and accept only plain props/callbacks.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, `fetch` (built-in), Expo public env vars (`EXPO_PUBLIC_*`). No new npm dependencies.

---

## Prerequisites

The backend server must be running and reachable from the simulator:
- Start it: `cd apps/backend && npm run dev` (prints `BantuJual API listening on http://localhost:3000`)
- iOS Simulator connects to `localhost:3000` directly
- Android Emulator: use `10.0.2.2:3000` — change `.env.local` accordingly

---

## File Structure

```
apps/mobile/
├── .env.local                                  # Task 1 — create (gitignored)
├── lib/
│   └── api.ts                                  # Task 1 — create
├── context/
│   └── AuthContext.tsx                         # Task 2 — modify
├── features/auth/screens/
│   ├── EmailScreen.tsx                         # Task 3 — modify
│   └── OtpScreen.tsx                           # Task 4 — modify
└── app/auth/
    └── otp.tsx                                 # Task 4 — modify (same task as OtpScreen)
```

---

## Task 1: API client (`lib/api.ts`) + env var

**Files:**
- Create: `apps/mobile/.env.local`
- Create: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Create `.env.local`**

Create the file `apps/mobile/.env.local` with this exact content:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

This file is already covered by the existing `.gitignore` pattern (`.env*` local files are not committed). Expo SDK 49+ automatically exposes `EXPO_PUBLIC_*` variables to the JS bundle — no extra package needed.

- [ ] **Step 2: Create `apps/mobile/lib/api.ts`**

```ts
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  profileCompleted: boolean;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function requestOtp(email: string): Promise<void> {
  await post('/auth/otp/request', { email });
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; user: VerifiedUser }> {
  return post('/auth/otp/verify', { email, code });
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: PASS — `lib/api.ts` is new and has no external dependencies.

- [ ] **Step 4: Commit**

```bash
cd apps/mobile && git add lib/api.ts
git commit -m "feat(mobile): API client with requestOtp and verifyOtp"
```

Note: `.env.local` is gitignored — do not add it to the commit.

---

## Task 2: Update `AuthContext` — fix User type, store token

**Files:**
- Modify: `apps/mobile/context/AuthContext.tsx`

- [ ] **Step 1: Write the full updated file**

Replace the entire contents of `apps/mobile/context/AuthContext.tsx` with:

```tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  profileCompleted: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = user !== null;

  const login = useCallback((userData: User, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, isLoading, login, logout }}>
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

Key changes from the original:
- `User.phone: string` removed → `User.email: string` added
- `User.name?: string` → `User.name: string | null`
- `User.profileCompleted: boolean` added
- `token: string | null` added to state and context
- `login()` now calls `setToken(accessToken)`
- `logout()` now also clears `setToken(null)`
- `User` is exported so `lib/api.ts`'s `VerifiedUser` shape can be assigned to it

- [ ] **Step 2: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: TypeScript will report errors in files that still reference `user.phone` or pass `User` objects with the old shape. Note these — they will be fixed in subsequent tasks. If the only errors are about `onVerify` vs `onSuccess` in `app/auth/otp.tsx` and the screens, that is expected and will be resolved in Tasks 3 and 4.

- [ ] **Step 3: Commit**

```bash
cd apps/mobile && git add context/AuthContext.tsx
git commit -m "feat(mobile): update AuthContext User type and store access token"
```

---

## Task 3: Wire `EmailScreen` to real API

**Files:**
- Modify: `apps/mobile/features/auth/screens/EmailScreen.tsx`

- [ ] **Step 1: Write the full updated file**

Replace the entire contents of `apps/mobile/features/auth/screens/EmailScreen.tsx` with:

```tsx
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmailInput } from '../components/EmailInput';
import { requestOtp, ApiError } from '@/lib/api';

interface EmailScreenProps {
  onSubmit: (email: string) => void;
  onGuestLogin: () => void;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function EmailScreen({ onSubmit, onGuestLogin }: EmailScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!EMAIL_REGEX.test(email)) return;
    setIsLoading(true);
    setError(null);
    try {
      await requestOtp(email);
      onSubmit(email);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status < 500
          ? 'Terjadi kesalahan. Coba lagi.'
          : 'Server error. Coba beberapa saat lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = EMAIL_REGEX.test(email);

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="w-full h-48 rounded-2xl mb-8 items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Text className="text-gray-400 text-sm">Illustration Placeholder</Text>
          </View>

          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Masuk atau Daftar
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Kami akan mengirimkan kode verifikasi ke email Anda
          </Text>

          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Email
            </Text>
            <EmailInput
              value={email}
              onChangeText={setEmail}
              onSubmit={handleContinue}
              disabled={isLoading}
            />
            {error !== null && (
              <Text className="text-sm text-red-500 mt-2">{error}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValidEmail || isLoading}
            className={`rounded-xl py-4 items-center ${isValidEmail && !isLoading ? 'bg-black' : 'bg-gray-300'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-base font-semibold ${isValidEmail && !isLoading ? 'text-white' : 'text-gray-500'}`}>
              {isLoading ? 'Mengirim...' : 'Lanjutkan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onGuestLogin}
            className="rounded-xl py-4 items-center bg-transparent border border-gray-300 mt-3"
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-gray-700">
              Masuk tanpa login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

Changes from the original:
- Added `import { requestOtp, ApiError } from '@/lib/api'`
- Added `error` state
- `handleContinue` now calls `await requestOtp(email)` and shows errors; `onSubmit` only fires on success
- Error message rendered below the `EmailInput` when non-null

- [ ] **Step 2: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: This file typechecks cleanly. Remaining errors are still in `OtpScreen` / `app/auth/otp.tsx` (fixed in Task 4).

- [ ] **Step 3: Commit**

```bash
cd apps/mobile && git add features/auth/screens/EmailScreen.tsx
git commit -m "feat(mobile): wire EmailScreen to POST /auth/otp/request"
```

---

## Task 4: Wire `OtpScreen` + update route wrapper

Both files are changed in one task because renaming `onVerify` → `onSuccess` on `OtpScreen` makes `app/auth/otp.tsx` fail TypeScript immediately — they must be updated atomically.

**Files:**
- Modify: `apps/mobile/features/auth/screens/OtpScreen.tsx`
- Modify: `apps/mobile/app/auth/otp.tsx`

- [ ] **Step 1: Write the full updated `OtpScreen.tsx`**

Replace the entire contents of `apps/mobile/features/auth/screens/OtpScreen.tsx` with:

```tsx
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { OtpInput } from '../components/OtpInput';
import { requestOtp, verifyOtp, ApiError, type VerifiedUser } from '@/lib/api';

interface OtpScreenProps {
  email: string;
  onSuccess: (user: VerifiedUser, token: string) => void;
  onBack: () => void;
}

export function OtpScreen({ email, onSuccess, onBack }: OtpScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await verifyOtp(email, otp);
      onSuccess(user, accessToken);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? 'Kode salah atau sudah kadaluarsa.'
          : 'Terjadi kesalahan. Coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setError(null);
    try {
      await requestOtp(email);
    } catch {
      setError('Gagal mengirim ulang kode. Coba lagi.');
    }
  };

  const isComplete = otp.length === 6;

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={onBack}
            className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </TouchableOpacity>

          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Verifikasi Email
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Masukkan kode 6 digit yang dikirim ke {email}
          </Text>

          <View className="mb-4">
            <OtpInput value={otp} onChangeText={setOtp} disabled={isLoading} />
            {error !== null && (
              <Text className="text-sm text-red-500 mt-2 text-center">{error}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isComplete || isLoading}
            className={`rounded-xl py-4 items-center mb-4 ${isComplete && !isLoading ? 'bg-black' : 'bg-gray-300'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-base font-semibold ${isComplete && !isLoading ? 'text-white' : 'text-gray-500'}`}>
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-600">Tidak menerima kode? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-sm font-semibold text-primary">Kirim ulang kode</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-sm font-semibold text-gray-400">
                Kirim ulang dalam {countdown}s
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

Changes from the original:
- `onVerify: () => void` replaced with `onSuccess: (user: VerifiedUser, token: string) => void`
- Added `error` state
- `handleVerify` calls `await verifyOtp(email, otp)` and then `onSuccess(user, accessToken)` on success
- `handleResend` calls `await requestOtp(email)` instead of just resetting state
- Error message rendered below OTP input when non-null
- `mb-8` on the OTP input `View` changed to `mb-4` to make room for the error text

- [ ] **Step 2: Write the full updated `app/auth/otp.tsx`**

Replace the entire contents of `apps/mobile/app/auth/otp.tsx` with:

```tsx
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
      onSuccess={(user, token) => {
        login(user, token);
        router.replace((returnTo as any) || '/(tabs)');
      }}
      onBack={() => router.back()}
    />
  );
}
```

Changes from the original:
- Added `import { useAuth } from '@/context/AuthContext'`
- `const { login } = useAuth()` destructured
- `onVerify` prop replaced with `onSuccess={(user, token) => { login(user, token); router.replace(...) }}`
- Navigation goes to `/(tabs)` (or `returnTo`) instead of `/auth/complete-profile` — the profile completion screen wiring is a separate future task

- [ ] **Step 3: Typecheck — must be clean**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: **PASS with zero errors.** All four changed files (`AuthContext.tsx`, `EmailScreen.tsx`, `OtpScreen.tsx`, `app/auth/otp.tsx`) should typecheck cleanly together.

If there are errors, read them carefully. Common issues:
- `User` type mismatch: `VerifiedUser` from `lib/api.ts` and `User` from `AuthContext.tsx` must have the same shape — both have `id`, `email`, `name: string | null`, `profileCompleted: boolean`. TypeScript structural typing means they are assignable without an explicit cast.
- `router.replace` type: the `(returnTo as any)` cast is intentional.

- [ ] **Step 4: Commit**

```bash
cd apps/mobile && git add features/auth/screens/OtpScreen.tsx app/auth/otp.tsx
git commit -m "feat(mobile): wire OtpScreen to POST /auth/otp/verify, login on success"
```

---

## Task 5: Manual end-to-end verification

No automated tests are configured in the mobile project. Verify the flow manually in the simulator.

- [ ] **Step 1: Ensure the backend is running**

In a separate terminal:
```bash
cd apps/backend && npm run dev
```
Expected output: `BantuJual API listening on http://localhost:3000`

- [ ] **Step 2: Start the mobile dev server**

```bash
cd apps/mobile && npx expo start
```

Press `i` for iOS Simulator (or `a` for Android Emulator — remember to change `.env.local` to `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` for Android).

- [ ] **Step 3: Walk through the happy path**

1. Navigate to the auth screen (tap any protected route, or navigate to `/auth` directly)
2. Enter a real email address (e.g. your own) and tap **Lanjutkan**
3. Watch the **backend terminal** — it will print: `[email] OTP for your@email.com: 123456`
4. Enter that 6-digit code in the app and tap **Verifikasi**
5. Expected: app navigates to `/(tabs)`, you are logged in

- [ ] **Step 4: Verify auth state is set**

After login, open the **Akun** tab (settings). If the screen shows any user info (name, email), it is reading from `AuthContext`. Even if it shows a placeholder, the key check is that `isAuthenticated` is `true` — the app should NOT redirect back to `/auth` when you navigate to protected routes.

- [ ] **Step 5: Verify error states**

1. On the email screen: disconnect the backend (`Ctrl-C` in backend terminal), enter an email, tap Lanjutkan — should show the error message below the email input. Restart the backend.
2. On the OTP screen: enter `000000` (wrong code) — should show "Kode salah atau sudah kadaluarsa."

- [ ] **Step 6: Final commit**

No code changes in this task. If you needed to fix anything to make the flow work, commit those fixes with a descriptive message before finishing.

---

## Done — what this delivers

- `lib/api.ts` — reusable typed fetch functions; foundation for all future API calls
- `AuthContext` — User type matches the real backend, access token stored in memory
- `EmailScreen` — calls real `POST /auth/otp/request`, shows errors
- `OtpScreen` — calls real `POST /auth/otp/verify`, passes user + token up via `onSuccess`
- `app/auth/otp.tsx` — calls `login()` then navigates; screens stay context-free

**Not in scope (next steps):**
- Persisting token across app restarts (needs `@react-native-async-storage`)
- Wiring `CompleteProfileScreen` to `PATCH /users/me`
- TanStack Query (add when wiring product/search endpoints in Phase 3)
