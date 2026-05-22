# Navigation Structure Design

**Date:** 2026-05-22
**Status:** Draft
**Approach:** Route Groups dengan Auth Guard

---

## Overview

Production-grade navigation structure untuk BantuJual dengan hybrid authentication model. Guest bisa browse, tapi aksi tertentu membutuhkan login.

---

## Authentication Model

### Guest Capabilities
- Browse Home
- Cari produk
- Lihat Product detail
- Lihat Profile seller

### Requires Login
- Jual barang
- Chat dengan seller
- Akses tab Akun/Settings

---

## Navigation Zones

### 1. Public Zone
Routes yang bisa diakses tanpa login.

### 2. Protected Zone
Routes yang membutuhkan authentication. Akan redirect ke Auth jika belum login.

### 3. Auth Zone
Flow login/signup. Setelah berhasil, kembali ke origin.

---

## File Structure

```
app/
├── _layout.tsx                    # Root layout (setup AuthProvider)
│
├── (public)/                      # Public Zone
│   ├── _layout.tsx                # Stack navigator
│   ├── index.tsx                  # Entry → redirect to beranda
│   ├── beranda.tsx                # Home screen
│   ├── cari.tsx                   # Search screen
│   ├── product/[id].tsx           # Product detail
│   └── user/[id].tsx              # Seller public profile
│
├── (protected)/                   # Protected Zone
│   ├── _layout.tsx                # Stack + AuthGuard
│   ├── sell/index.tsx             # Sell wizard
│   ├── chat/[id].tsx              # Chat conversation
│   └── settings/
│       ├── index.tsx              # Settings main
│       ├── profil.tsx
│       ├── handphone.tsx
│       ├── keamanan.tsx
│       └── notifikasi.tsx
│
├── (tabs)/                        # Tab navigator
│   ├── _layout.tsx                # Tabs dengan per-tab auth logic
│   ├── beranda.tsx                # Link to /(public)/beranda
│   ├── cari.tsx                   # Link to /(public)/cari
│   ├── jual.tsx                   # Protected entry
│   ├── chat.tsx                   # Protected entry
│   └── akun.tsx                   # Protected entry
│
├── auth/
│   ├── _layout.tsx                # Auth flow stack
│   ├── index.tsx                  # Phone input
│   ├── otp.tsx                    # OTP verification
│   ├── complete-profile.tsx       # Profile completion
│   └── success.tsx                # Success screen
│
└── _sitemap.tsx
```

---

## Tab Bar Behavior

| Tab | Guest | Logged In | Action if Not Auth |
|-----|-------|-----------|---------------------|
| Beranda | Home | Home | - |
| Cari | Search | Search | - |
| Jual | Auth | Sell | Redirect to /auth |
| Chat | Auth | Chat List | Redirect to /auth |
| Akun | Auth | Settings | Redirect to /auth |

---

## Auth Flow

### Login Trigger
User mencoba akses protected route → AuthGuard check → Not authenticated → Redirect to /auth dengan `returnTo` parameter.

### After Login Success
1. Ambil `returnTo` dari route params
2. Jika ada → navigate ke route tersebut
3. Jika tidak ada → navigate ke /beranda

### Logout Flow
1. Clear auth state (token, user data)
2. Navigate to /beranda sebagai guest
3. No modal, clean redirect

---

## Key Components

### AuthProvider
Context provider yang menyimpan:
- `isAuthenticated: boolean`
- `user: User | null`
- `isLoading: boolean`
- `login(token): void`
- `logout(): void`

### useAuth Hook
Hook untuk akses auth state di manapun dalam app.

### AuthGuard Component
Wrapper untuk protected routes:
```tsx
function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  if (!isAuthenticated) {
    router.replace(`/auth?returnTo=${pathname}`);
    return null;
  }
  
  return children;
}
```

---

## Route Presentation

Semua routes menggunakan `presentation: 'card'` (default), bukan modal.

Pengecualian:
- Tidak ada, semua full screen transition

---

## Migration Notes

### Dari Struktur Lama

1. **Move files:**
   - `(tabs)/index.tsx` → `(public)/beranda.tsx`
   - `(tabs)/cari.tsx` → `(public)/cari.tsx`
   - `product/[id].tsx` → `(public)/product/[id].tsx`
   - `user/[id].tsx` → `(public)/user/[id].tsx`
   - `sell/index.tsx` → `(protected)/sell/index.tsx`
   - `chat/[id].tsx` → `(protected)/chat/[id].tsx`
   - `settings/*` → `(protected)/settings/*`

2. **Create new files:**
   - `(public)/_layout.tsx`
   - `(protected)/_layout.tsx`
   - `(protected)/settings/index.tsx` (pindah dari SettingsScreen)
   - Context: `context/AuthContext.tsx`
   - Hook: `hooks/useAuth.ts`

3. **Modify files:**
   - `app/_layout.tsx` - wrap dengan AuthProvider, remove modal presentation
   - `(tabs)/_layout.tsx` - add per-tab auth logic

4. **Delete/Harcode:**
   - Remove `presentation: 'modal'` dari auth route

---

## Edge Cases

### Deep Linking ke Protected Route
Jika user click deep link ke protected route tapi belum login:
- Redirect ke auth dengan `returnTo`
- Setelah login, navigate ke deep link route

### Session Expired
Jika token expired saat user di protected route:
- Show toast/notification "Session expired"
- Redirect ke auth dengan `returnTo`
- User harus login ulang

### Back Button Setelah Logout
Logout → Home. User press back:
- Seharusnya tidak bisa back ke protected route
- Solusi: gunakan `router.replace` bukan `router.push`

---

## Success Criteria

- [ ] Guest bisa browse tanpa login
- [ ] Guest klik Jual/Chat/Akun → redirect ke Auth
- [ ] Setelah login → kembali ke origin
- [ ] Logout → redirect ke Home
- [ ] Back button tidak bisa akses protected route setelah logout
- [ ] Deep linking ke protected route → auth → redirect ke route
- [ ] Tab bar konsisten untuk guest dan logged in user
