# Hono Homepage Dashboard Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the `hono-homepage` Bubble endpoint to the dashboard screen, replacing all hardcoded stat values with live data.

**Architecture:** Create `homepage.api.ts` to POST to `/hono-homepage` with today's date in device timezone, a `use-homepage.ts` React Query hook following the `use-locations` pattern, then update `dashboard-screen.tsx` to consume the hook and render live values.

**Tech Stack:** React Native, Expo, TanStack Query (`@tanstack/react-query`), `AsyncStorage` via `getBubbleToken()`, plain JS `Date` for timezone offset (no extra library).

---

### Task 1: Create `homepage.api.ts`

**Files:**
- Create: `apps/mobile/features/dashboard/api/homepage.api.ts`

- [ ] **Step 1: Create the file**

```ts
import { getBubbleToken } from '@/features/auth/store/auth.store';

const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export interface HomepageStats {
  messages_count: number;
  booking_confirmed: number;
  chat_responded: number;
  revenue_with_heep: number;
  credit: number;
  avg_daily_usage: number;
  project_usage: number;
  unfulfilled_request: number;
  most_requested_time: string;
}

function getTodayWithDeviceTimezone(): string {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mo}-${dd}T00:00:00.000${sign}${hh}:${mm}`;
}

export async function fetchHomepageStats(): Promise<HomepageStats | null> {
  const token = await getBubbleToken();
  if (!token) return null;

  const res = await fetch(`${BUBBLE_API_URL}/hono-homepage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date: getTodayWithDeviceTimezone() }),
  });

  if (!res.ok) throw new Error('Failed to load homepage stats');

  const { response } = await res.json() as { status: string; response: HomepageStats };
  return response;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/dashboard/api/homepage.api.ts
git commit -m "feat(dashboard): add fetchHomepageStats API"
```

---

### Task 2: Create `use-homepage.ts` hook

**Files:**
- Create: `apps/mobile/features/dashboard/hooks/use-homepage.ts`

- [ ] **Step 1: Create the file**

```ts
import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchHomepageStats } from '../api/homepage.api';

export function useHomepage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useQuery({
    queryKey: ['homepage'],
    queryFn: fetchHomepageStats,
    enabled: ready,
    staleTime: 1000 * 60 * 5,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/dashboard/hooks/use-homepage.ts
git commit -m "feat(dashboard): add useHomepage query hook"
```

---

### Task 3: Wire hook into `dashboard-screen.tsx`

**Files:**
- Modify: `apps/mobile/features/dashboard/screens/dashboard-screen.tsx`

- [ ] **Step 1: Import the hook and replace hardcoded values**

At the top of the file, add the import:

```ts
import { useHomepage } from '@/features/dashboard/hooks/use-homepage';
```

Inside `DashboardScreen`, add the hook call after the existing hooks:

```ts
const { data: stats } = useHomepage();
```

- [ ] **Step 2: Update the greeting text**

Replace:
```tsx
<Text className="mt-6 max-w-xs text-2xl self-start tracking-[-1] font-light">
  Hi — Heep has handled 461 messages for you.
</Text>
```

With:
```tsx
<Text className="mt-6 max-w-xs text-2xl self-start tracking-[-1] font-light">
  Hi — Heep has handled {stats?.messages_count ?? 0} messages for you.
</Text>
```

- [ ] **Step 3: Update Bookings confirmed**

Replace:
```tsx
<Text className="text-7xl font-normal leading-tighter tracking-tight">
  12
</Text>
<Text className="text-xs mb-2 shrink">
  Bookings confirmed
</Text>
```

With:
```tsx
<Text className="text-7xl font-normal leading-tighter tracking-tight">
  {stats?.booking_confirmed ?? 0}
</Text>
<Text className="text-xs mb-2 shrink">
  Bookings confirmed
</Text>
```

- [ ] **Step 4: Update Chats responded**

Replace:
```tsx
<Text className="text-7xl font-normal leading-tighter tracking-tight">
  12
</Text>
<Text className="text-xs mb-2 shrink">
  Chats responded
</Text>
```

With:
```tsx
<Text className="text-7xl font-normal leading-tighter tracking-tight">
  {stats?.chat_responded ?? 0}
</Text>
<Text className="text-xs mb-2 shrink">
  Chats responded
</Text>
```

- [ ] **Step 5: Update Revenue with heep**

Replace:
```tsx
<Text className="text-[44px] font-normal tracking-tight">
  23.000€
</Text>
```

With:
```tsx
<Text className="text-[44px] font-normal tracking-tight">
  {stats?.revenue_with_heep ?? 0}€
</Text>
```

- [ ] **Step 6: Update Credits remaining**

Replace:
```tsx
<Text className="text-7xl font-normal leading-tighter tracking-tight">
  1000
</Text>
<Text className="text-xs mb-2 shrink">Credits remaining</Text>
```

With:
```tsx
<Text className="text-7xl font-normal leading-tighter tracking-tight">
  {stats?.credit ?? 0}
</Text>
<Text className="text-xs mb-2 shrink">Credits remaining</Text>
```

- [ ] **Step 7: Update Avg daily usage**

Replace:
```tsx
<Text className="text-5xl font-normal tracking-tight">
  24
</Text>
<Text className="text-xs mb-2 shrink">messages/day</Text>
```

With:
```tsx
<Text className="text-5xl font-normal tracking-tight">
  {stats?.avg_daily_usage ?? 0}
</Text>
<Text className="text-xs mb-2 shrink">messages/day</Text>
```

- [ ] **Step 8: Update Unfulfilled Requests pill**

Replace:
```tsx
<Text className="text-xs font-semibold shrink">22</Text>
<Text className="text-xs shrink">Unfulfilled Requests</Text>
```

With:
```tsx
<Text className="text-xs font-semibold shrink">{stats?.unfulfilled_request ?? 0}</Text>
<Text className="text-xs shrink">Unfulfilled Requests</Text>
```

- [ ] **Step 9: Update Most Requested Time pill**

Replace:
```tsx
<Text className="text-xs font-semibold shrink">-</Text>
<Text className="text-xs shrink">Most Requested Time</Text>
```

With:
```tsx
<Text className="text-xs font-semibold shrink">{stats?.most_requested_time ?? '-'}</Text>
<Text className="text-xs shrink">Most Requested Time</Text>
```

- [ ] **Step 10: Commit**

```bash
git add apps/mobile/features/dashboard/screens/dashboard-screen.tsx
git commit -m "feat(dashboard): wire hono-homepage stats to dashboard screen"
```
