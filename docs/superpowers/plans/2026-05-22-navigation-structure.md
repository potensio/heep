# Navigation Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor navigation structure dari modal-based ke route groups dengan auth guard untuk hybrid guest/authenticated experience.

**Architecture:** 3 zona navigasi (public, protected, auth) dengan AuthProvider context dan AuthGuard component. Tab bar mengarah ke zona yang sesuai berdasarkan authentication state.

**Tech Stack:** Expo Router, React Context, React Native

---

## File Structure Changes

### New Files
```
apps/mobile/
├── context/
│   └── AuthContext.tsx           # AuthProvider + useAuth
├── app/
│   ├── (public)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── beranda.tsx
│   │   ├── cari.tsx
│   │   └── product/[id].tsx
│   ├── (protected)/
│   │   ├── _layout.tsx
│   │   ├── sell/index.tsx
│   │   ├── chat/[id].tsx
│   │   └── settings/*
│   └── (tabs)/
│       ├── beranda.tsx
│       ├── cari.tsx
│       ├── jual.tsx
│       ├── chat.tsx
│       └── akun.tsx
```

---

## Task 1: Create AuthContext and useAuth Hook

**Files:**
- Create: `apps/mobile/context/AuthContext.tsx`

- [ ] **Step 1: Create AuthContext with provider**

```tsx
// context/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  phone: string;
  name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = user !== null;

  const login = useCallback((userData: User, token: string) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
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

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/context/AuthContext.tsx
git commit -m "feat: add AuthContext and useAuth hook"
```

---

## Task 2: Update Root Layout with AuthProvider

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Add AuthProvider and update route structure**

Read current file, then modify to wrap with AuthProvider and update Stack.Screen configuration to use route groups instead of individual screens.

Key changes:
- Import AuthProvider from `@/context/AuthContext`
- Wrap children with `<AuthProvider>`
- Update Stack.Screen to reference `(public)`, `(protected)`, `(tabs)` instead of individual routes
- Remove `presentation: 'modal'` from auth screen

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat: wrap app with AuthProvider and update route structure"
```

---

## Task 3: Create Public Zone

**Files:**
- Create: `apps/mobile/app/(public)/_layout.tsx`
- Create: `apps/mobile/app/(public)/index.tsx`
- Create: `apps/mobile/app/(public)/beranda.tsx`
- Create: `apps/mobile/app/(public)/cari.tsx`

- [ ] **Step 1: Create public layout**

```tsx
// app/(public)/_layout.tsx
import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="beranda" />
      <Stack.Screen name="cari" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create index redirect**

```tsx
// app/(public)/index.tsx
import { Redirect } from 'expo-router';

export default function PublicIndex() {
  return <Redirect href="/beranda" />;
}
```

- [ ] **Step 3: Create beranda screen**

```tsx
// app/(public)/beranda.tsx
import { HomeScreen } from "@/features/home/HomeScreen";

export default function BerandaScreen() {
  return <HomeScreen />;
}
```

- [ ] **Step 4: Create cari screen**

```tsx
// app/(public)/cari.tsx
import { SearchScreen } from "@/features/search/SearchScreen";

export default function CariScreen() {
  return <SearchScreen />;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(public\)
git commit -m "feat: add public zone with home and search"
```

---

## Task 4: Move Product to Public Zone

**Files:**
- Create: `apps/mobile/app/(public)/product/[id].tsx` (copy from existing)

- [ ] **Step 1: Create directory and copy product detail**

```bash
mkdir -p apps/mobile/app/\(public\)/product
cp apps/mobile/app/product/\[id\].tsx apps/mobile/app/\(public\)/product/\[id\].tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add product detail to public zone"
```

---

## Task 5: Create Protected Zone Layout with AuthGuard

**Files:**
- Create: `apps/mobile/app/(protected)/_layout.tsx`

- [ ] **Step 1: Create protected layout with AuthGuard**

```tsx
// app/(protected)/_layout.tsx
import { Stack, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/auth?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sell/index" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/profil" />
        <Stack.Screen name="settings/handphone" />
        <Stack.Screen name="settings/keamanan" />
        <Stack.Screen name="settings/notifikasi" />
      </Stack>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(protected\)/_layout.tsx
git commit -m "feat: add protected zone layout with AuthGuard"
```

---

## Task 6: Move Sell to Protected Zone

**Files:**
- Create: `apps/mobile/app/(protected)/sell/index.tsx` (copy from existing)

- [ ] **Step 1: Create directory and copy sell screen**

```bash
mkdir -p apps/mobile/app/\(protected\)/sell
cp apps/mobile/app/sell/index.tsx apps/mobile/app/\(protected\)/sell/index.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add sell to protected zone"
```

---

## Task 7: Move Chat to Protected Zone

**Files:**
- Create: `apps/mobile/app/(protected)/chat/[id].tsx` (copy from existing)

- [ ] **Step 1: Create directory and copy chat screen**

```bash
mkdir -p apps/mobile/app/\(protected\)/chat
cp apps/mobile/app/chat/\[id\].tsx apps/mobile/app/\(protected\)/chat/\[id\].tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add chat to protected zone"
```

---

## Task 8: Move Settings to Protected Zone

**Files:**
- Create: `apps/mobile/app/(protected)/settings/` directory with all settings files

- [ ] **Step 1: Create directory and copy settings files**

```bash
mkdir -p apps/mobile/app/\(protected\)/settings
cp apps/mobile/app/settings/*.tsx apps/mobile/app/\(protected\)/settings/
```

- [ ] **Step 2: Create settings index screen**

```tsx
// app/(protected)/settings/index.tsx
import { SettingsScreen } from "@/features/settings/SettingsScreen";

export default function SettingsIndex() {
  return <SettingsScreen />;
}
```

- [ ] **Step 3: Update settings layout**

Read `apps/mobile/app/(protected)/settings/_layout.tsx` and add the index screen to the Stack.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add settings to protected zone"
```

---

## Task 9: Update Tab Layout

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update tab layout with auth-aware tabs**

Modify the existing tab layout to:
1. Import `useAuth` from `@/context/AuthContext`
2. Update beranda tab to link to `/beranda`
3. Update cari tab to link to `/cari`
4. Update jual tab to check auth before navigating to `/sell`
5. Update chat tab to show placeholder if not authenticated
6. Update akun tab to redirect to auth if not authenticated

The key change: Tab buttons for protected routes should check `isAuthenticated` and redirect to `/auth?returnTo=currentPath` if not logged in.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat: update tab layout with auth logic"
```

---

## Task 10: Update Auth Flow for ReturnTo

**Files:**
- Modify: `apps/mobile/app/auth/index.tsx`
- Modify: `apps/mobile/app/auth/success.tsx`

- [ ] **Step 1: Update auth index to capture returnTo param**

Read and modify `apps/mobile/app/auth/index.tsx` to:
1. Import `useLocalSearchParams` from expo-router
2. Pass returnTo param through the auth flow

- [ ] **Step 2: Update success screen to redirect to returnTo**

Read and modify `apps/mobile/app/auth/success.tsx` to:
1. Import `useRouter`, `useLocalSearchParams` from expo-router
2. Get returnTo from params
3. After login success, navigate to returnTo or `/beranda`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/auth/index.tsx apps/mobile/app/auth/success.tsx
git commit -m "feat: add returnTo handling in auth flow"
```

---

## Task 11: Update Logout Behavior

**Files:**
- Modify: `apps/mobile/features/settings/SettingsScreen.tsx`

- [ ] **Step 1: Update logout to redirect to beranda**

Read and modify `apps/mobile/features/settings/SettingsScreen.tsx`:
1. Import `useAuth` from `@/context/AuthContext`
2. Call `logout()` from useAuth
3. Change `router.replace("/auth")` to `router.replace("/beranda")`

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/settings/SettingsScreen.tsx
git commit -m "feat: update logout to redirect to beranda"
```

---

## Task 12: Clean Up Old Files

**Files:**
- Delete old files that have been moved

- [ ] **Step 1: Remove old route files**

After verifying new structure works:

```bash
rm -rf apps/mobile/app/product
rm -rf apps/mobile/app/user
rm -rf apps/mobile/app/sell
rm -rf apps/mobile/app/chat
rm -rf apps/mobile/app/settings
rm apps/mobile/app/\(tabs\)/index.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove old route structure"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Test guest flow**
- Guest can access beranda
- Guest can access cari
- Guest can view product detail
- Guest clicks jual → redirect to auth
- Guest clicks akun → redirect to auth

- [ ] **Step 2: Test authenticated flow**
- Login flow works
- Can access sell
- Can access chat
- Can access settings
- Logout redirects to beranda

- [ ] **Step 3: Test returnTo flow**
- Guest clicks jual → goes to auth
- After login → returns to sell
- Same for other protected routes

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify navigation structure complete"
```

---

## Success Criteria Checklist

- [ ] Guest bisa browse beranda tanpa login
- [ ] Guest bisa cari produk tanpa login
- [ ] Guest bisa lihat product detail tanpa login
- [ ] Guest klik jual → redirect ke auth
- [ ] Guest klik chat → redirect ke auth
- [ ] Guest klik akun → redirect ke auth
- [ ] Setelah login → kembali ke origin (returnTo)
- [ ] Logout → redirect ke beranda
- [ ] Back button tidak bisa akses protected route setelah logout
- [ ] Tab bar konsisten untuk guest dan logged in user
