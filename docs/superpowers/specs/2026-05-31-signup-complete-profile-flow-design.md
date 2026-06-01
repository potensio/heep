# Design: Fix Signup Flow — New User Must Complete Profile

**Date:** 2026-05-31
**Status:** Approved

## Problem

After OTP verification, `app/auth/otp.tsx` unconditionally calls `login()` and redirects to `/(tabs)`, regardless of whether the user is new. New users skip the complete-profile step entirely even though the route and screen already exist. Additionally, `CompleteProfileScreen` has the wrong fields (has email, missing phone).

## Goal

After a successful OTP verification, if `user.profileCompleted === false`, force the user through the complete-profile screen (name, gender, phone number) before entering the app. Only call `login()` once the profile is truly complete.

---

## Data Flow

### New user
```
EmailScreen → OtpScreen (verify OTP)
  → profileCompleted === false
  → navigate /auth/complete-profile?token=...&email=...&returnTo=...
  → CompleteProfileScreen (name, gender, phone)
  → PATCH /users/me (Bearer token)
  → login(updatedUser, token)
  → /auth/success → /(tabs)
```

### Returning user
```
EmailScreen → OtpScreen (verify OTP)
  → profileCompleted === true
  → login(user, token)
  → returnTo || /(tabs)
```

`login()` is only called once, after the profile is complete. No "partially authenticated" state exists.

---

## Backend Changes

### 1. `src/core/db/schema.ts`
Add `phone` column to the `users` table:
```ts
phone: text('phone'),
```

### 2. DB Migration
Run `db:generate` then `db:migrate` to apply the schema change.

### 3. `src/modules/users/users.validation.ts`
Add `phone` to `updateProfileSchema`:
```ts
phone: z.string().min(5).max(20).optional(),
```

### 4. `src/modules/users/users.repository.ts`
Add `phone` to `UpdateUserInput`:
```ts
phone?: string;
```

---

## Mobile Changes

### 1. `lib/api.ts`
Add `phone` to `VerifiedUser`:
```ts
export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
}
```

Add `updateProfile` function:
```ts
export async function updateProfile(
  token: string,
  data: { name: string; gender: 'male' | 'female'; phone: string }
): Promise<VerifiedUser>
```
Sends `PATCH /users/me` with `Authorization: Bearer {token}`. Returns the full updated user from the backend — the route passes this directly to `login()`.

### 2. `context/AuthContext.tsx`
Add optional `phone` field to the `User` type:
```ts
phone: string | null;
```

### 3. `app/auth/otp.tsx`
Branch in `onSuccess` based on `user.profileCompleted`:
- `false` → navigate to `/auth/complete-profile` with `token`, `email`, `returnTo` params (do **not** call `login()`)
- `true` → `login(user, token)` → `router.replace(returnTo || '/(tabs)')`

### 4. `app/auth/complete-profile.tsx`
- Read `token` and `email` from route params
- Pass both as props to `CompleteProfileScreen`
- `onSubmit(updatedUser)` → `login(updatedUser, token)` → navigate to `/auth/success`

### 5. `features/auth/screens/CompleteProfileScreen.tsx`
New props interface:
```ts
interface CompleteProfileScreenProps {
  email: string;
  token: string;
  onSubmit: (user: VerifiedUser) => void;
}
```
- Remove the email `TextInput` field (email is already known from auth, not needed in the form)
- Replace it with a phone number `TextInput` field
- Gender values sent to backend: `'male'` / `'female'` (not `'pria'` / `'wanita'` — the DB enum uses English)
- `handleSubmit` calls `updateProfile(token, { name, gender, phone })`, then `onSubmit(updatedUser)`
- Validation: all three fields (name, gender, phone) must be non-empty

---

## What Does NOT Change

- `OtpScreen` component — no changes, `onSuccess` signature stays the same
- `EmailScreen` — no changes
- `SuccessScreen` — no changes
- `app/auth/success.tsx` — no changes
- The mock-OTP dev bypass in `__DEV__` mode

---

## Files Touched Summary

| Layer | File | Change |
|---|---|---|
| Backend | `src/core/db/schema.ts` | Add `phone` column |
| Backend | `src/modules/users/users.validation.ts` | Add `phone` to schema |
| Backend | `src/modules/users/users.repository.ts` | Add `phone` to `UpdateUserInput` |
| Mobile | `lib/api.ts` | Add `updateProfile()` |
| Mobile | `context/AuthContext.tsx` | Add `phone` to `User` type |
| Mobile | `app/auth/otp.tsx` | Branch on `profileCompleted` |
| Mobile | `app/auth/complete-profile.tsx` | Read `token`+`email` params, call `login()` |
| Mobile | `features/auth/screens/CompleteProfileScreen.tsx` | New props, replace email→phone field |
