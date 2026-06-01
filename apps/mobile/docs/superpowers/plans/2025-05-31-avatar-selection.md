# Avatar Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace gender selection with avatar selection during signup, storing avatarUrl and auto-inferring gender from avatar choice.

**Spec:** `docs/superpowers/specs/2025-05-31-avatar-selection-design.md`

**Architecture:** Create new AvatarSelector component with 9 predefined avatars. Update CompleteProfileScreen to use it. Add avatarUrl to API types. Gender is extracted from avatar URL pattern.

**Tech Stack:** React Native, TypeScript, NativeWind

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `features/auth/components/AvatarSelector.tsx` | Create | Render 9 avatar options, handle selection |
| `features/auth/screens/CompleteProfileScreen.tsx` | Modify | Replace GenderSelector with AvatarSelector |
| `features/auth/components/GenderSelector.tsx` | Delete | No longer needed |
| `lib/api.ts` | Modify | Add avatarUrl to VerifiedUser and updateProfile |
| `context/AuthContext.tsx` | Modify | Add avatarUrl to User interface |

---

### Task 1: Add avatarUrl to API types

**Files:**
- Modify: `lib/api.ts`

- [ ] **Step 1: Add avatarUrl to VerifiedUser interface**

```typescript
export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
  avatarUrl: string | null;
}
```

- [ ] **Step 2: Add avatarUrl to updateProfile parameter**

```typescript
export async function updateProfile(
  token: string,
  data: {
    name?: string;
    gender?: 'male' | 'female';
    avatarUrl?: string;
    phone?: string;
    location?: Location;
  },
): Promise<VerifiedUser>
```

- [ ] **Step 3: Commit**

```bash
git add lib/api.ts
git commit -m "feat(api): add avatarUrl to VerifiedUser and updateProfile"
```

---

### Task 2: Add avatarUrl to User interface in AuthContext

**Files:**
- Modify: `context/AuthContext.tsx`

- [ ] **Step 1: Add avatarUrl to User interface**

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
  avatarUrl: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add context/AuthContext.tsx
git commit -m "feat(auth): add avatarUrl to User interface"
```

---

### Task 3: Create AvatarSelector component

**Files:**
- Create: `features/auth/components/AvatarSelector.tsx`

- [ ] **Step 1: Create AvatarSelector component**

```typescript
import { View, Image, TouchableOpacity } from 'react-native';

const AVATARS = [
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-a.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-b.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-c.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-d.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-male-e.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-a.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-b.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-c.png',
  'https://pub-98b8abc847b44937af301636076ac9ba.r2.dev/default-avatar/avatar-female-d.png',
];

interface AvatarSelectorProps {
  value: string | null;
  onChange: (url: string) => void;
}

export function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  return (
    <View className="items-center">
      <View className="flex-row gap-3 mb-3">
        {AVATARS.slice(0, 5).map((url) => (
          <TouchableOpacity
            key={url}
            onPress={() => onChange(url)}
            activeOpacity={0.8}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: value === url ? 3 : 2,
              borderColor: value === url ? '#155DFC' : '#D1D5DB',
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: url }}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-row gap-3">
        {AVATARS.slice(5).map((url) => (
          <TouchableOpacity
            key={url}
            onPress={() => onChange(url)}
            activeOpacity={0.8}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: value === url ? 3 : 2,
              borderColor: value === url ? '#155DFC' : '#D1D5DB',
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: url }}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/components/AvatarSelector.tsx
git commit -m "feat(auth): add AvatarSelector component"
```

---

### Task 4: Update CompleteProfileScreen

**Files:**
- Modify: `features/auth/screens/CompleteProfileScreen.tsx`
- Delete: `features/auth/components/GenderSelector.tsx`

- [ ] **Step 1: Update imports - remove GenderSelector, add AvatarSelector**

Replace:
```typescript
import { GenderSelector } from '../components/GenderSelector';
```

With:
```typescript
import { AvatarSelector } from '../components/AvatarSelector';
```

- [ ] **Step 2: Add helper function to extract gender from avatar URL**

Add after imports:
```typescript
function getGenderFromAvatarUrl(url: string): 'male' | 'female' {
  if (url.includes('avatar-male-')) return 'male';
  return 'female';
}
```

- [ ] **Step 3: Change state from gender to avatarUrl**

Replace:
```typescript
const [gender, setGender] = useState<LocalGender>(null);
```

With:
```typescript
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
```

Remove the LocalGender type definition (no longer needed):
```typescript
type LocalGender = 'pria' | 'wanita' | null;
```

- [ ] **Step 4: Update isValid validation**

Replace:
```typescript
const isValid = name.trim().length > 0 && phone.trim().length > 0 && gender !== null && location !== null;
```

With:
```typescript
const isValid = name.trim().length > 0 && phone.trim().length > 0 && avatarUrl !== null && location !== null;
```

- [ ] **Step 5: Update handleSubmit to send avatarUrl and gender**

Replace:
```typescript
const updatedUser = await updateProfile(token, {
  name: name.trim(),
  gender: gender === 'pria' ? 'male' : 'female',
  phone: phone.trim(),
  location,
});
```

With:
```typescript
const updatedUser = await updateProfile(token, {
  name: name.trim(),
  gender: getGenderFromAvatarUrl(avatarUrl!),
  avatarUrl,
  phone: phone.trim(),
  location,
});
```

- [ ] **Step 6: Replace GenderSelector with AvatarSelector and reorder fields**

Move avatar section to top, after the title/description. Replace:
```typescript
<View className="mb-8">
  <Text className="text-sm text-gray-600 mb-2 font-medium">Jenis Kelamin</Text>
  <GenderSelector value={gender} onChange={setGender} />
</View>
```

With:
```typescript
<View className="mb-6">
  <Text className="text-sm text-gray-600 mb-3 font-medium text-center">Pilih Avatar</Text>
  <AvatarSelector value={avatarUrl} onChange={setAvatarUrl} />
</View>
```

Position this block immediately after the description text and before "Nama Lengkap" field.

- [ ] **Step 7: Delete GenderSelector file**

```bash
rm features/auth/components/GenderSelector.tsx
```

- [ ] **Step 8: Commit**

```bash
git add features/auth/screens/CompleteProfileScreen.tsx features/auth/components/AvatarSelector.tsx
git add -u features/auth/components/GenderSelector.tsx
git commit -m "feat(auth): replace GenderSelector with AvatarSelector in signup"
```

---

### Task 5: Verify implementation

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Test in app**

Start the dev server and navigate through the signup flow:
1. Enter email
2. Enter OTP
3. Complete profile screen should show avatar selector at top
4. Select avatar, fill other fields
5. Submit should work

- [ ] **Step 3: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve type errors in avatar selection"
```
