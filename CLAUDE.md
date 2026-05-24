# BantuJual — Project Map

Second-hand marketplace mobile app. Users can list products, chat with buyers/sellers, and manage their account.

## Monorepo

```
bantujual/
├── apps/mobile/     ← React Native (Expo) — primary focus
├── apps/backend/
└── apps/web/
```

---

## Mobile Stack (`apps/mobile`)

| | |
|---|---|
| Framework | Expo SDK 54, React Native 0.81 |
| Routing | Expo Router v6 (file-based) |
| Styling | NativeWind v4 |
| Animation | React Native Reanimated v4 |
| Bottom sheet | @gorhom/bottom-sheet v5 |
| Icons | @solar-icons/react-native |
| Fonts | Fjalla One (heading), Plus Jakarta Sans (body) |

```bash
cd apps/mobile
npx expo start       # dev server
npx tsc --noEmit     # type check
```

---

## Architecture Rules

- **Feature-first**: all logic lives in `features/<name>/`
- **Routes are thin wrappers**: `app/` files only read params and pass props — no business logic
- **Props over routing**: feature screens accept callbacks and data as props, never call `useRouter`/`useLocalSearchParams` internally
- **No barrel exports**: always import directly to the target file, never via `index.ts`
- **Shared UI only** in `components/ui/`: no feature-specific components here

---

## File Structure

```
apps/mobile/
├── app/                              # Expo Router routes (thin wrappers only)
│   ├── _layout.tsx                   # Root layout: fonts, providers
│   ├── (tabs)/
│   │   ├── index.tsx                 → features/home/HomeScreen
│   │   ├── inbox.tsx                 → features/inbox/InboxScreen
│   │   ├── chat.tsx                  → features/chat/ConversationListScreen
│   │   └── akun.tsx                  → features/settings/SettingsScreen
│   ├── (public)/
│   │   ├── product/[id].tsx          → features/product/ProductDetailScreen
│   │   ├── user/[id].tsx             → features/seller/SellerProfileScreen
│   │   └── search.tsx                → features/search/SearchProductsScreen
│   ├── (protected)/
│   │   ├── chat/[id].tsx             → features/chat/ChatRoomScreen
│   │   ├── sell/                     # foto → info → kategori → review → success
│   │   └── settings/                 # profil, handphone, keamanan, notifikasi
│   └── auth/                         # index → otp → complete-profile → success
│
├── features/
│   ├── auth/
│   │   ├── components/               # GenderSelector, OtpInput, PhoneInput
│   │   └── screens/                  # PhoneScreen, OtpScreen, CompleteProfileScreen, SuccessScreen
│   ├── chat/
│   │   ├── components/               # ChatInput, ConversationCard, MessageBubble, etc.
│   │   ├── ConversationListScreen.tsx
│   │   ├── ChatRoomScreen.tsx        # accepts { conversation, initialMessages } props
│   │   ├── mockData.ts
│   │   └── types.ts
│   ├── home/
│   │   ├── components/               # BannerCarousel, ActionGrid, OrderCard, SummaryCard
│   │   └── HomeScreen.tsx
│   ├── inbox/
│   │   └── InboxScreen.tsx
│   ├── orders/
│   │   └── OrdersScreen.tsx          # WIP — no route yet
│   ├── product/
│   │   ├── ProductDetail.tsx         # reusable display component (used in ReviewStep too)
│   │   └── ProductDetailScreen.tsx   # accepts { id: string } prop
│   ├── search/
│   │   ├── components/               # ProductCard, SearchBar, EmptyState, SortDropdown, etc.
│   │   ├── context/FilterSheetContext.tsx
│   │   └── SearchProductsScreen.tsx
│   ├── sell/
│   │   ├── components/               # PhotoUploadStep, ProductInfoStep, CategoryStep, ReviewStep, etc.
│   │   ├── context/SellFormContext.tsx
│   │   ├── hooks/useSellForm.ts
│   │   └── types.ts
│   ├── seller/
│   │   └── SellerProfileScreen.tsx   # accepts { id: string } prop
│   └── settings/
│       ├── components/               # ProfileSettings, PhoneSettings, SecuritySettings, NotificationSettings, SettingsItem
│       └── SettingsScreen.tsx        # accepts navigation callbacks as props
│
├── components/
│   ├── icons/TabIcons.tsx
│   └── ui/                           # Avatar, Button, ErrorBoundary, themed-text
│
├── context/
│   └── AuthContext.tsx               # isAuthenticated, user, login, logout
│
├── lib/
│   ├── mockData.ts                   # shared mock products (temporary)
│   ├── firebase.ts                   # ⚠ firebase package not installed
│   └── storage.ts                    # ⚠ @react-native-async-storage not installed
│
└── constants.ts                      # design tokens (mirrored in tailwind.config.js)
```

---

## Design Tokens

| Token | Value |
|---|---|
| `primary` | `#155DFC` |
| `background` | `#F9F2E6` |
| `accent.neon` | `#c5e302` |
| `accent.red` | `#FB2C36` |
| `font-heading` | Fjalla One |
| body font | Plus Jakarta Sans |

---

## Auth Flow

State is in-memory only (not persisted). In `__DEV__`, all protected routes are accessible without login.

```
/auth → /auth/otp → /auth/complete-profile → /auth/success → /(tabs)
```

`returnTo` param is threaded through the entire flow for post-login redirect.

## Sell Flow

State managed in `SellFormContext`.

```
/(protected)/sell/foto → info → kategori → review → success
```

---

## Known Issues

- `features/orders/OrdersScreen.tsx` — no route pointing here yet
- `components/ui/icon-symbol.tsx` — `expo-symbols` not installed
- `lib/firebase.ts` / `lib/storage.ts` — packages not installed
- `features/sell/components/SuccessScreen.tsx` — uses `fullWidth` prop that doesn't exist on `Button`
- All product data is hardcoded in `lib/mockData.ts`, not connected to API
