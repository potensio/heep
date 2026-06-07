# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a settings screen with Account / Notifications / Activation tabs — Account fully built (display-only profile fields + logout + delete), the other two as stubs.

**Architecture:** `SettingsScreen` owns tab state and renders one of three section components based on active tab. Each section is a separate file under `features/settings/components/`. The screen itself mirrors the dashboard layout: `ScrollView` inside a safe-area-aware `Box`, rounded cards, Phosphor icons, pill buttons.

**Tech Stack:** React Native, Expo Router, Tailwind/NativeWind classes, Phosphor icons (`phosphor-react-native`), `@testing-library/react-native`, `jest-expo`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `features/settings/components/account-section.tsx` | Display-only profile fields + logout + delete |
| Create | `features/settings/components/notifications-section.tsx` | Stub card |
| Create | `features/settings/components/activation-section.tsx` | Stub card |
| Create | `features/settings/components/__tests__/account-section.test.tsx` | Unit tests for AccountSection |
| Create | `features/settings/components/__tests__/settings-screen.test.tsx` | Tab switching tests |
| Modify | `features/settings/screens/settings-screen.tsx` | Replace placeholder with tab UI |

---

## Task 1: AccountSection component

**Files:**
- Create: `features/settings/components/__tests__/account-section.test.tsx`
- Create: `features/settings/components/account-section.tsx`

- [ ] **Step 1: Write the failing tests**

Create `features/settings/components/__tests__/account-section.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AccountSection } from '../account-section';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

describe('AccountSection', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  it('renders profile fields', () => {
    const { getByText } = render(<AccountSection />);
    expect(getByText('Hanif')).toBeTruthy();
    expect(getByText('Yaskur')).toBeTruthy();
    expect(getByText('hanifyaskur@gmail.com')).toBeTruthy();
  });

  it('calls router.replace with /auth on log out press', () => {
    const { getByText } = render(<AccountSection />);
    fireEvent.press(getByText('Log out'));
    expect(mockReplace).toHaveBeenCalledWith('/auth');
  });

  it('renders delete account button', () => {
    const { getByText } = render(<AccountSection />);
    expect(getByText('Delete my account')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/mobile && npx jest features/settings/components/__tests__/account-section.test.tsx --watchAll=false
```

Expected: FAIL — `Cannot find module '../account-section'`

- [ ] **Step 3: Implement AccountSection**

Create `features/settings/components/account-section.tsx`:

```tsx
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SignOut, X } from 'phosphor-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <VStack style={{ marginBottom: 16 }}>
      <Text className="text-xs" style={{ color: '#666666', marginBottom: 6 }}>
        {label}
      </Text>
      <View
        className="rounded-full px-4 justify-center"
        style={{ backgroundColor: '#e5e5e5', height: 48 }}
      >
        <Text className="text-base text-foreground">{value}</Text>
      </View>
    </VStack>
  );
}

export function AccountSection() {
  const router = useRouter();

  return (
    <View testID="account-section" className="bg-white rounded-[32px] p-6 mt-6">
      <Text className="text-xl font-semibold" style={{ marginBottom: 16 }}>
        Account
      </Text>

      <ProfileField label="First Name" value="Hanif" />
      <ProfileField label="Last Name" value="Yaskur" />
      <ProfileField label="Email" value="hanifyaskur@gmail.com" />

      <Pressable
        onPress={() => router.replace('/auth')}
        className="flex-row items-center rounded-full self-start"
        style={{ backgroundColor: '#f4a89a', paddingHorizontal: 20, paddingVertical: 14, gap: 8, marginBottom: 12 }}
      >
        <Text className="text-base" style={{ color: '#c0392b' }}>
          Log out
        </Text>
        <SignOut size={18} color="#c0392b" weight="regular" />
      </Pressable>

      <Pressable
        className="flex-row items-center rounded-full self-start"
        style={{ backgroundColor: '#fcd5cf', paddingHorizontal: 20, paddingVertical: 14, gap: 8 }}
      >
        <Text className="text-base" style={{ color: '#c0392b' }}>
          Delete my account
        </Text>
        <X size={18} color="#c0392b" weight="regular" />
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/mobile && npx jest features/settings/components/__tests__/account-section.test.tsx --watchAll=false
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/features/settings/components/account-section.tsx apps/mobile/features/settings/components/__tests__/account-section.test.tsx
git commit -m "feat: add AccountSection with profile fields and logout action"
```

---

## Task 2: Stub section components

**Files:**
- Create: `features/settings/components/notifications-section.tsx`
- Create: `features/settings/components/activation-section.tsx`

- [ ] **Step 1: Create NotificationsSection stub**

Create `features/settings/components/notifications-section.tsx`:

```tsx
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export function NotificationsSection() {
  return (
    <View testID="notifications-section" className="bg-white rounded-[32px] p-6 mt-6">
      <Text className="text-xl font-semibold" style={{ marginBottom: 16 }}>
        Notifications
      </Text>
      <VStack className="items-center" style={{ marginTop: 16 }}>
        <Text className="text-sm" style={{ opacity: 0.5 }}>
          Coming soon
        </Text>
      </VStack>
    </View>
  );
}
```

- [ ] **Step 2: Create ActivationSection stub**

Create `features/settings/components/activation-section.tsx`:

```tsx
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export function ActivationSection() {
  return (
    <View testID="activation-section" className="bg-white rounded-[32px] p-6 mt-6">
      <Text className="text-xl font-semibold" style={{ marginBottom: 16 }}>
        Activation
      </Text>
      <VStack className="items-center" style={{ marginTop: 16 }}>
        <Text className="text-sm" style={{ opacity: 0.5 }}>
          Coming soon
        </Text>
      </VStack>
    </View>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/settings/components/notifications-section.tsx apps/mobile/features/settings/components/activation-section.tsx
git commit -m "feat: add Notifications and Activation stub sections"
```

---

## Task 3: SettingsScreen with tab navigation

**Files:**
- Create: `features/settings/components/__tests__/settings-screen.test.tsx`
- Modify: `features/settings/screens/settings-screen.tsx`

- [ ] **Step 1: Write the failing tests**

Create `features/settings/components/__tests__/settings-screen.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import SettingsScreen from '../../screens/settings-screen';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
  });

  it('renders the Settings title', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
  });

  it('shows AccountSection by default', () => {
    const { getByTestId } = render(<SettingsScreen />);
    expect(getByTestId('account-section')).toBeTruthy();
  });

  it('switches to NotificationsSection when Notifications tab is pressed', () => {
    const { getByTestId, queryByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('tab-notifications'));
    expect(queryByTestId('account-section')).toBeNull();
    expect(getByTestId('notifications-section')).toBeTruthy();
  });

  it('switches to ActivationSection when Activation tab is pressed', () => {
    const { getByTestId, queryByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('tab-activation'));
    expect(queryByTestId('account-section')).toBeNull();
    expect(getByTestId('activation-section')).toBeTruthy();
  });

  it('switches back to AccountSection when Account tab is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('tab-notifications'));
    fireEvent.press(getByTestId('tab-account'));
    expect(getByTestId('account-section')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/mobile && npx jest features/settings/components/__tests__/settings-screen.test.tsx --watchAll=false
```

Expected: FAIL — tests should fail because the screen doesn't render tabs yet

- [ ] **Step 3: Implement SettingsScreen**

Replace the full contents of `features/settings/screens/settings-screen.tsx`:

```tsx
import { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretRight, CaretDown } from 'phosphor-react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { AccountSection } from '../components/account-section';
import { NotificationsSection } from '../components/notifications-section';
import { ActivationSection } from '../components/activation-section';

type Tab = 'account' | 'notifications' | 'activation';

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'activation', label: 'Activation' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
      >
        <Text
          className="text-4xl font-light mt-6"
          style={{ opacity: 0.4, letterSpacing: -1 }}
        >
          Settings
        </Text>

        <HStack className="mt-6" style={{ gap: 10, flexWrap: 'wrap' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                testID={`tab-${tab.id}`}
                onPress={() => setActiveTab(tab.id)}
                className="flex-row items-center rounded-full"
                style={{
                  backgroundColor: isActive ? '#1a1a1a' : '#ffffff',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  gap: 6,
                }}
              >
                <Text style={{ color: isActive ? '#ffffff' : '#1a1a1a', fontSize: 14 }}>
                  {tab.label}
                </Text>
                {isActive ? (
                  <CaretDown size={14} color="#ffffff" weight="regular" />
                ) : (
                  <CaretRight size={14} color="#1a1a1a" weight="regular" />
                )}
              </Pressable>
            );
          })}
        </HStack>

        {activeTab === 'account' && <AccountSection />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'activation' && <ActivationSection />}
      </ScrollView>
    </Box>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/mobile && npx jest features/settings/components/__tests__/settings-screen.test.tsx --watchAll=false
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Run full settings test suite**

```bash
cd apps/mobile && npx jest features/settings --watchAll=false
```

Expected: PASS — all 8 tests passing (3 account-section + 5 settings-screen)

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/features/settings/screens/settings-screen.tsx apps/mobile/features/settings/components/__tests__/settings-screen.test.tsx
git commit -m "feat: implement settings screen with tab navigation"
```
