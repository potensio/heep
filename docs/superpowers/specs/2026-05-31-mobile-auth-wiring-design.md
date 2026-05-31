# Mobile ↔ Backend Auth Wiring — Design

**Date:** 2026-05-31
**Status:** Approved (design phase)
**Scope:** Wire the mobile app's existing email-OTP auth screens to the real backend API. No new dependencies. No TanStack Query (auth is mutations — nothing to cache).

---

## 1. Goal

A user can open the app, enter their email, receive a real OTP (logged to the server console in dev via `ConsoleEmailService`), enter it, and be fully logged in — `AuthContext.isAuthenticated` becomes `true`, `user` has their real ID and email from the database.

---

## 2. What Is Mocked Today

| File | Mock behaviour |
|---|---|
| `features/auth/screens/EmailScreen.tsx` | `handleContinue` uses `setTimeout(1000)` instead of calling the API |
| `features/auth/screens/OtpScreen.tsx` | `handleVerify` uses `setTimeout(1000)` instead of calling the API; any 6 digits pass; `handleResend` only resets the countdown |
| `context/AuthContext.tsx` | `login()` receives `token` but discards it; `User.phone` field is stale (flow moved to email) |

---

## 3. Files Changed

| File | Change |
|---|---|
| `lib/api.ts` | **Create** — typed fetch functions for `requestOtp` and `verifyOtp` |
| `context/AuthContext.tsx` | **Modify** — fix `User.phone → User.email`; store `token` in state |
| `features/auth/screens/EmailScreen.tsx` | **Modify** — replace `setTimeout` with real API call; add error state |
| `features/auth/screens/OtpScreen.tsx` | **Modify** — replace `setTimeout` with real API call; add `onSuccess` prop; wire resend |
| `app/auth/otp.tsx` | **Modify** — pass `onSuccess` callback that calls `login()` then navigates |

---

## 4. API Client (`lib/api.ts`)

### Base URL

Uses Expo's built-in public env var system. Create `apps/mobile/.env.local` (gitignored):

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

In `lib/api.ts`:
```ts
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
```

**Simulator notes:**
- iOS Simulator: `localhost:3000` works directly
- Android Emulator: use `10.0.2.2:3000`

### ApiError

```ts
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
```

Thrown on any non-2xx response. Screens catch this to show specific messages.

### Exported functions

```ts
export async function requestOtp(email: string): Promise<void>
```
- `POST /auth/otp/request` with `{ email }`
- Returns `void` on success
- Throws `ApiError` on failure (e.g. 400 invalid email shape, 500 server error)
- Note: the backend always returns `{ ok: true }` even for unknown emails (no account enumeration) — so this never throws a "user not found" error

```ts
export async function verifyOtp(
  email: string,
  code: string
): Promise<{ accessToken: string; refreshToken: string; user: VerifiedUser }>
```

Where `VerifiedUser` is:
```ts
export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  profileCompleted: boolean;
}
```

- `POST /auth/otp/verify` with `{ email, code }`
- Returns tokens + user on success
- Throws `ApiError(401, ...)` for wrong/expired code

---

## 5. AuthContext Changes (`context/AuthContext.tsx`)

### User type fix

```ts
// Before
interface User {
  id: string;
  phone: string;   // ← stale, flow moved to email
  name?: string;
}

// After
interface User {
  id: string;
  email: string;
  name: string | null;
  profileCompleted: boolean;
}
```

### Store the token

Add `token: string | null` to state and context type. `login()` stores it:

```ts
const [token, setToken] = useState<string | null>(null);

const login = useCallback((userData: User, accessToken: string) => {
  setUser(userData);
  setToken(accessToken);
}, []);

const logout = useCallback(() => {
  setUser(null);
  setToken(null);
}, []);
```

Expose `token` in context so future authenticated API calls can read it via `useAuth()`.

---

## 6. EmailScreen Changes

**Prop interface: unchanged** — `onSubmit(email: string)` is still called on success.

**`handleContinue` replacement:**
```ts
const handleContinue = async () => {
  if (!EMAIL_REGEX.test(email)) return;
  setIsLoading(true);
  setError(null);
  try {
    await requestOtp(email);
    onSubmit(email);
  } catch (e) {
    setError(e instanceof ApiError && e.status < 500
      ? 'Terjadi kesalahan. Coba lagi.'
      : 'Server error. Coba beberapa saat lagi.');
  } finally {
    setIsLoading(false);
  }
};
```

Add `error: string | null` state. Render the error string below the email input when non-null.

---

## 7. OtpScreen Changes

### New prop

```ts
onSuccess: (user: VerifiedUser, token: string) => void;
```

The existing `onVerify: () => void` prop is **removed** and replaced by `onSuccess`. The route wrapper (`app/auth/otp.tsx`) calls `login()` + navigation inside `onSuccess`.

### `handleVerify` replacement

```ts
const handleVerify = async () => {
  if (otp.length !== 6) return;
  setIsLoading(true);
  setError(null);
  try {
    const { accessToken, user } = await verifyOtp(email, otp);
    onSuccess(user, accessToken);
  } catch (e) {
    setError(e instanceof ApiError && e.status === 401
      ? 'Kode salah atau sudah kadaluarsa.'
      : 'Terjadi kesalahan. Coba lagi.');
  } finally {
    setIsLoading(false);
  }
};
```

### `handleResend` replacement

```ts
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
```

Add `error: string | null` state. Render the error string below the OTP input.

---

## 8. Route Wrapper Change (`app/auth/otp.tsx`)

```ts
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

`login()` updates `AuthContext`, then `router.replace` sends the user to their destination. The `complete-profile` redirect (for `profileCompleted: false`) is a future enhancement — for now all verified users land on `/(tabs)`.

---

## 9. What Is Not In Scope

- Persisting tokens across app restarts (`lib/storage.ts` + `@react-native-async-storage` — deferred; `lib/storage.ts` stub already exists)
- Refresh token rotation / silent token refresh
- `complete-profile` screen wired to `PATCH /users/me`
- TanStack Query (not needed for mutations; add when wiring product/search endpoints)
- Resend API key (dev uses `ConsoleEmailService` — OTP logs to server terminal)

---

## 10. End-to-End Happy Path

1. User enters email → `POST /auth/otp/request` → server logs OTP to console
2. User reads OTP from server terminal → enters it → `POST /auth/otp/verify`
3. `AuthContext.login(user, token)` called → `isAuthenticated: true`
4. App navigates to `/(tabs)`
5. Future authenticated calls can read `token` from `useAuth()`
