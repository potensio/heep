# Avatar Selection — Design Spec

**Date:** 2025-05-31
**Status:** Approved

## Overview

Replace gender selection during signup with avatar selection. Users pick from 9 predefined avatars. Gender is automatically inferred from the avatar choice (male/female based on URL pattern) and stored in the database.

## Scope

**In scope:**
- New `AvatarSelector` component in signup flow
- Update `CompleteProfileScreen` to use avatar instead of gender selector
- Update API types to include `avatarUrl`
- Auto-detect gender from avatar URL

**Out of scope:**
- Changing avatar after signup (future feature)

## Predefined Avatars

**Male avatars (5):**
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-a.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-b.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-c.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-d.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-e.png`

**Female avatars (4):**
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-a.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-b.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-c.png`
- `https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-d.png`

**Total:** 9 avatars

## UI Design

### Screen Layout (CompleteProfileScreen)

```
┌────────────────────────────────────┐
│  Lengkapi Profil                   │
│  Berikan informasi untuk melanjutkan
│                                    │
│           Pilih Avatar             │
│                                    │
│    ╭───╮ ╭───╮ ╭───╮ ╭───╮ ╭───╮   │
│    │👤 │ │👤 │ │👤 │ │👤 │ │👤 │   │
│    ╰───╯ ╰───╯ ╰───╯ ╰───╯ ╰───╯   │
│    ╭───╮ ╭───╮ ╭───╮ ╭───╮        │
│    │👤 │ │👤 │ │👤 │ │👤 │        │
│    ╰───╯ ╰───╯ ╰───╯ ╰───╯        │
│                                    │
│  Nama Lengkap                      │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  Nomor Handphone                   │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  Kota                              │
│  ┌──────────────────────────────┐  │
│  │ 📍 Pilih kota...             │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │           Selesai            │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### Avatar Selector Component

**Layout:**
- 2 rows, 5 columns (first row: 5 male avatars, second row: 4 female avatars)
- Centered horizontally
- Circular avatars with border

**Avatar dimensions:**
- Size: 64x64 pixels
- Border radius: 32 (full circle)

**Border states:**
| State | Border |
|-------|--------|
| Not selected | 2px solid `#D1D5DB` (gray-300) |
| Selected | 3px solid `#155DFC` (primary) |

**Spacing:**
- Gap between avatars: 12px
- Gap between rows: 12px
- Margin below avatar selector: 24px

## Data Flow

### Gender Inference

When user selects an avatar, gender is automatically determined from the URL:

```
URL contains "avatar-male-"   → gender = 'male'
URL contains "avatar-female-" → gender = 'female'
```

### API Payload

```typescript
// PATCH /users/me
{
  name: string,
  phone: string,
  avatarUrl: string,  // new field
  gender: 'male' | 'female',  // inferred from avatarUrl
  location: { name, placeId, lat, lng }
}
```

## Components

### AvatarSelector

**Location:** `features/auth/components/AvatarSelector.tsx`

**Props:**
```typescript
interface AvatarSelectorProps {
  value: string | null;      // URL of selected avatar
  onChange: (url: string) => void;
}
```

**Responsibilities:**
- Render 9 avatar options in 2 rows
- Highlight selected avatar with primary border
- Call `onChange` when avatar is tapped

### CompleteProfileScreen Updates

**Changes:**
- Remove `GenderSelector` import and usage
- Add `AvatarSelector` import and usage
- Change state from `gender: 'pria' | 'wanita' | null` to `avatarUrl: string | null`
- Add `getGenderFromAvatarUrl()` helper to extract gender from URL
- Update validation: avatar must be selected to enable submit button
- Update `updateProfile()` call to include `avatarUrl` and `gender`
- Reorder fields: Avatar first, then name, phone, city

## Type Changes

### lib/api.ts

```typescript
export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
  avatarUrl: string | null;  // add
}

export async function updateProfile(
  token: string,
  data: {
    name?: string;
    gender?: 'male' | 'female';
    avatarUrl?: string;  // add
    phone?: string;
    location?: Location;
  },
): Promise<VerifiedUser>
```

### context/AuthContext.tsx

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
  avatarUrl: string | null;  // add
}
```

## Files to Modify

1. `features/auth/components/AvatarSelector.tsx` — **NEW**
2. `features/auth/screens/CompleteProfileScreen.tsx` — replace GenderSelector with AvatarSelector
3. `features/auth/components/GenderSelector.tsx` — **DELETE** (no longer needed)
4. `lib/api.ts` — add `avatarUrl` to `VerifiedUser` interface and `updateProfile` param
5. `context/AuthContext.tsx` — add `avatarUrl` to `User` interface

## Backend Status

Backend already supports `avatarUrl`:
- ✅ Schema has `avatarUrl` field
- ✅ Validation accepts `avatarUrl: z.string().url().optional()`
- ✅ `PATCH /users/me` endpoint accepts `avatarUrl`

No backend changes required.
