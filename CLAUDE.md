# BantuJual — Project Map

Marketplace mobile app untuk jual-beli barang bekas. User bisa listing produk, chat dengan penjual/pembeli, dan kelola akun.

## Monorepo Structure

```
bantujual/
├── apps/
│   ├── mobile/     ← React Native (Expo) — focus utama
│   ├── backend/    ← Backend API
│   └── web/        ← Web version
└── docs/
```

---

## Mobile App (`apps/mobile`)

### Stack
- **Framework**: Expo SDK 54, React Native 0.81
- **Routing**: Expo Router v6 (file-based)
- **Styling**: NativeWind v4 (Tailwind untuk RN)
- **Animasi**: React Native Reanimated v4
- **Bottom sheet**: @gorhom/bottom-sheet v5
- **Icons**: @solar-icons/react-native
- **Fonts**: Fjalla One (heading), Plus Jakarta Sans (body)

### Commands
```bash
cd apps/mobile
npx expo start          # dev server
npx tsc --noEmit        # type check
```

---

## Arsitektur File

### Prinsip utama
- **Feature-first**: semua logic per fitur ada di `features/<nama>/`
- **Route = thin wrapper**: file di `app/` hanya import dan render screen dari `features/`
- **Tidak ada barrel export** (`index.ts`): selalu import direct ke file yang dituju
- **Shared UI only** di `components/`: tidak ada komponen yang feature-specific di sini

### Struktur
```
apps/mobile/
├── app/                          # Expo Router routes (thin wrappers only)
│   ├── _layout.tsx               # Root layout: fonts, providers
│   ├── (tabs)/                   # Tab bar navigation
│   │   ├── index.tsx             → features/home/HomeScreen
│   │   ├── inbox.tsx             → features/inbox/InboxScreen
│   │   ├── jual.tsx              # Placeholder (FAB button di _layout)
│   │   ├── chat.tsx              → features/chat/ChatScreen
│   │   └── akun.tsx              → features/settings/SettingsScreen
│   ├── (public)/                 # Bisa diakses tanpa login
│   │   ├── product/[id].tsx      → features/product/ProductDetailScreen
│   │   └── user/[id].tsx         → features/seller/SellerProfileScreen
│   ├── (protected)/              # Butuh login
│   │   ├── chat/[id].tsx         → features/chat/ChatDetailScreen
│   │   ├── sell/                 # Multi-step sell flow
│   │   │   ├── foto.tsx / info.tsx / kategori.tsx / review.tsx / success.tsx
│   │   └── settings/
│   │       ├── profil.tsx / handphone.tsx / keamanan.tsx / notifikasi.tsx
│   └── auth/                     # Auth flow
│       ├── index.tsx             → features/auth/screens/PhoneScreen
│       ├── otp.tsx               → features/auth/screens/OtpScreen
│       ├── complete-profile.tsx  → features/auth/screens/CompleteProfileScreen
│       └── success.tsx           → features/auth/screens/SuccessScreen
│
├── features/                     # Semua logic & UI per fitur
│   ├── auth/
│   │   ├── components/           # GenderSelector, OtpInput, PhoneInput
│   │   └── screens/              # PhoneScreen, OtpScreen, CompleteProfileScreen, SuccessScreen
│   ├── chat/
│   │   ├── components/           # ChatInput, ConversationCard, MessageBubble, dll
│   │   ├── ChatScreen.tsx        # List conversations
│   │   ├── ChatDetailScreen.tsx  # 1-on-1 chat
│   │   ├── mockData.ts
│   │   └── types.ts
│   ├── home/
│   │   ├── components/           # BannerCarousel, ActionGrid, OrderCard, SummaryCard
│   │   └── HomeScreen.tsx
│   ├── inbox/
│   │   └── InboxScreen.tsx       # Notifikasi
│   ├── orders/
│   │   └── OrdersScreen.tsx      # WIP — belum ada route
│   ├── product/
│   │   ├── ProductDetail.tsx     # Reusable component (dipakai ReviewStep & ProductDetailScreen)
│   │   └── ProductDetailScreen.tsx
│   ├── search/
│   │   ├── components/           # ProductCard, SearchBar, EmptyState, dll
│   │   ├── context/
│   │   │   └── FilterSheetContext.tsx   # Filter/sort state — dipakai HomeScreen & SearchProductsScreen
│   │   └── SearchProductsScreen.tsx
│   ├── sell/
│   │   ├── components/           # Step-by-step form components
│   │   ├── context/
│   │   │   └── SellFormContext.tsx
│   │   ├── hooks/
│   │   │   └── useSellForm.ts
│   │   └── types.ts
│   ├── seller/
│   │   └── SellerProfileScreen.tsx   # Profil penjual (user lain)
│   └── settings/
│       ├── components/           # ProfileSettings, PhoneSettings, SecuritySettings, dll
│       └── SettingsScreen.tsx
│
├── components/
│   ├── icons/
│   │   └── TabIcons.tsx
│   └── ui/                       # Generic UI only
│       ├── Avatar.tsx
│       ├── Button.tsx
│       ├── ErrorBoundary.tsx
│       ├── themed-text.tsx
│       └── index.ts
│
├── context/
│   └── AuthContext.tsx            # Global auth state: isAuthenticated, user, login, logout
│
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── lib/
│   ├── firebase.ts                # Firebase init (package belum diinstall)
│   ├── mockData.ts                # Shared mock products — sumber data sementara
│   └── storage.ts                 # AsyncStorage wrapper (package belum diinstall)
│
├── assets/
│   ├── images/                    # banner-1/2/3.jpg, logo, splash, dll
│   └── icons/
│
└── constants.ts                   # Colors, spacing, theme tokens
```

---

## Design System

Semua token ada di `constants.ts` dan di-mirror ke `tailwind.config.js`.

| Token | Value |
|-------|-------|
| `primary` | `#155DFC` (biru) |
| `background` / `cream` | `#F9F2E6` (broken white) |
| `accent.neon` | `#c5e302` |
| `accent.red` | `#FB2C36` |
| Font heading | Fjalla One — `className="font-heading"` |
| Font body | Plus Jakarta Sans — default |

---

## Auth Flow

`AuthContext` menyimpan state di memory (belum persistent). Di `__DEV__` mode, semua protected route bisa diakses tanpa login — lihat `(tabs)/_layout.tsx`.

```
/auth → OTP → complete-profile → success → /(tabs)
```

---

## Sell Flow (Multi-step)

State dikelola di `SellFormContext`. Route: `/(protected)/sell/foto → info → kategori → review → success`.

---

## Known Issues / WIP

- `features/orders/OrdersScreen.tsx` — belum ada route yang mengarah ke sini
- `features/home/HomeScreen.tsx` — masih referensi `/(tabs)/cari` yang belum ada
- `lib/firebase.ts` dan `lib/storage.ts` — package `firebase` dan `@react-native-async-storage/async-storage` belum diinstall
- `components/ui/icon-symbol.tsx` — `expo-symbols` belum diinstall
- Data produk di `lib/mockData.ts` masih hardcoded, belum terhubung ke API
