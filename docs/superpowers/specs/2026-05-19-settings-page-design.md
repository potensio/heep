# Settings Page Design

**Date:** 2026-05-19  
**Status:** Approved

## Overview

A comprehensive settings page for BantuJual marketplace app, covering user profile, app preferences, and seller settings. Uses nested navigation pattern with a flat list of categories on the main menu, each navigating to a dedicated sub-page.

## Architecture

### Route Structure

File-based routing using Expo Router:

```
app/
├── (tabs)/
│   └── akun.tsx              → Settings menu (main entry point)
└── settings/
    ├── profil.tsx            → Profile editing
    ├── handphone.tsx         → Phone number management
    ├── keamanan.tsx          → Security settings
    ├── notifikasi.tsx        → Notification preferences
    └── toko.tsx              → Shop settings
```

### Navigation Flow

```
Akun Tab
   ↓
Settings Menu (flat list)
   ├── Profil → Profile editing page
   ├── Nomor Handphone → Phone management page
   ├── Keamanan → Security settings page
   ├── Notifikasi → Notification toggles page
   └── Toko → Shop settings page
```

Each sub-page has a back button returning to the main settings menu.

## Components

### New Feature Module: `features/settings/`

```
features/settings/
├── SettingsScreen.tsx        → Main settings menu
├── components/
│   ├── SettingsItem.tsx      → Reusable list item component
│   ├── ProfileSettings.tsx   → Profile form
│   ├── PhoneSettings.tsx     → Phone management
│   ├── SecuritySettings.tsx  → Security/password settings
│   ├── NotificationSettings.tsx → Notification toggles
│   └── ShopSettings.tsx      → Shop settings form
```

### SettingsItem Component

Reusable list item for the main menu:
- Left: Solar icon (linear style)
- Center: Category name (Indonesian text)
- Right: Chevron navigation indicator
- Consistent tap target with appropriate padding
- Press handler for navigation

Props:
```typescript
interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}
```

## Settings Categories

### 1. Profil (`app/settings/profil.tsx`)

Profile editing page:
- Avatar display (image or placeholder)
- Nama lengkap (full name) - text input
- Email - text input (possibly read-only initially)
- Save button
- Form validation
- Loading state on save

### 2. Nomor Handphone (`app/settings/handphone.tsx`)

Phone number management:
- Display current phone number
- Change/update phone number option
- Verification flow placeholder (to be expanded later)
- Simple UI for MVP

### 3. Keamanan (`app/settings/keamanan.tsx`)

Security settings:
- Change password section
  - Current password field
  - New password field
  - Confirm new password field
- Basic structure, extensible for future features (two-factor, session management)

### 4. Notifikasi (`app/settings/notifikasi.tsx`)

Notification preferences:
- Toggle switches for notification types:
  - Pesanan (order updates)
  - Chat (message notifications)
  - Promosi (promotional notifications)
- Preferences stored locally (AsyncStorage)
- Real toggle functionality

### 5. Toko (`app/settings/toko.tsx`)

Shop settings:
- Shop name - text input
- Description - text area
- Shop logo/avatar - image display with change option
- Save button

## Visual Design

### Consistency with Existing App

Follow patterns established in the app:

- **Icons:** Solar icons (linear style), matching `Bell` from `@solar-icons/react-native/Linear`
- **Typography:** 
  - `font-heading` for section titles
  - Consistent text sizes matching HomeScreen
- **Colors:** App's Tailwind color scheme:
  - `bg-background` for page backgrounds
  - Standard text colors (`text-gray-*`)
- **Cards:** Rounded corners, subtle styling similar to `OrderCard`
- **Spacing:** Consistent padding/margins (px-5, gap patterns from HomeScreen)

### Main Menu Layout

- Flat list of categories
- Section headers for grouping (Profile & Account, App Settings, Seller Settings)
- Clean, minimal styling
- No special visual hierarchy (all items equal prominence)

### Sub-pages Layout

- Header with back button and page title
- Content area with forms/preferences
- Action buttons where needed
- Safe area handling

## Data & State Management

### Initial Implementation

- Local state with `useState` for forms
- Mock/default values for display
- Placeholder save functionality (console.log or alert)
- AsyncStorage for notification preferences (booleans)

### Future Considerations

- Backend API integration for profile/shop updates
- Phone number verification flow
- Password change API
- Real-time persistence

## Error Handling

- Form validation on required fields
- Inline error messages below fields
- Loading states during save operations
- Success feedback (toast or alert)
- Disabled state for save button during loading

## Implementation Order

1. Create `features/settings/` module structure
2. Build `SettingsItem` component
3. Build main `SettingsScreen` with navigation
4. Update `app/(tabs)/akun.tsx` to use SettingsScreen
5. Create route files in `app/settings/`
6. Implement each sub-page:
   - Profil (simplest, good starting point)
   - Notifikasi (toggle states)
   - Toko (shop form)
   - Keamanan (password fields)
   - Handphone (simple display)

## Testing Considerations

- Each settings page testable in isolation
- Form validation tests
- Navigation flow tests
- Toggle state persistence tests

## Files to Create

1. `features/settings/SettingsScreen.tsx`
2. `features/settings/components/SettingsItem.tsx`
3. `features/settings/components/ProfileSettings.tsx`
4. `features/settings/components/PhoneSettings.tsx`
5. `features/settings/components/SecuritySettings.tsx`
6. `features/settings/components/NotificationSettings.tsx`
7. `features/settings/components/ShopSettings.tsx`
8. `app/settings/profil.tsx`
9. `app/settings/handphone.tsx`
10. `app/settings/keamanan.tsx`
11. `app/settings/notifikasi.tsx`
12. `app/settings/toko.tsx`

## Files to Modify

1. `app/(tabs)/akun.tsx` - Replace placeholder with SettingsScreen
