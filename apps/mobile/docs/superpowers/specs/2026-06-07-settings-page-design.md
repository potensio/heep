# Settings Page Design

**Date:** 2026-06-07
**Status:** Approved

## Overview

A settings screen with three tabbed sections — Account (fully built), Notifications and Activation (stubs). Follows the same visual language as the dashboard screen: rounded cards, pill buttons, Phosphor icons, safe-area-aware layout.

## Architecture

```
features/settings/
  screens/
    settings-screen.tsx         ← tab state, tab pill row, renders active section
  components/
    account-section.tsx         ← profile fields (display-only) + logout + delete
    notifications-section.tsx   ← stub
    activation-section.tsx      ← stub
```

The `settings-screen.tsx` holds a single `useState<'account' | 'notifications' | 'activation'>` defaulting to `'account'`. It renders the tab pill row and delegates content rendering to the appropriate section component.

## Visual Design

### Header
- Large `text-4xl font-light tracking-tight` title "Settings" — same light weight as the dashboard greeting text.
- Sits below `insets.top` with `paddingHorizontal: 16`.

### Tab Pill Row
- Horizontal `HStack` with `gap-3`, `mt-6`.
- Each pill is a `Pressable` with `rounded-full px-5 py-3`.
- **Active:** dark background (`bg-foreground`) + white text, no icon.
- **Inactive:** white background (`bg-white`) + dark text + `CaretRight` icon (size 14) from `phosphor-react-native`.
- Tabs in order: Account, Notifications, Activation.

### Account Section (`account-section.tsx`)
White `rounded-[32px]` card (`bg-white p-6 mt-6`).

**Section header:** `"Account"` in `text-xl font-semibold mb-4`.

**Profile fields** — three read-only display fields, each following this pattern:
```
<VStack gap-1.5 mb-4>
  <Text className="text-xs text-typography-500">First Name</Text>
  <View className="bg-[#e5e5e5] rounded-full px-4 h-12 justify-center">
    <Text className="text-base text-foreground">Hanif</Text>
  </View>
</VStack>
```
Fields: First Name, Last Name, Email. Static values for now.

**Actions:**
- `Log out` — `rounded-full` button, salmon background (`bg-[#f4a89a]`), `SignOut` Phosphor icon (size 18) + text. Calls `router.replace('/auth')`.
- `Delete my account` — `rounded-full` button, lighter salmon (`bg-[#fcd5cf]`), `X` Phosphor icon (size 18) + text. No-op for now (just a stub press handler).

Both buttons are `self-start` width (not full-width), matching the screenshot.

### Stub Sections (`notifications-section.tsx`, `activation-section.tsx`)
Each renders a white `rounded-[32px]` card (`mt-6 p-6`) with:
- Section header matching the active tab name.
- A centered `Text` reading `"Coming soon"` in `text-sm opacity-50`.

## Constraints

- All icons from `phosphor-react-native` only (project rule).
- No `FlatList`, no `AsyncStorage`, no `Animated` from RN core (project rules).
- `ScrollView` wraps the content to handle smaller screens.
- `useSafeAreaInsets` for top padding.
- Static data only — no API calls in this session.
