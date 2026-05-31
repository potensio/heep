# Location Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add city-level location to BantuJual so users can set their city and product listings display where items are sold, with Google Places Autocomplete for city selection.

**Architecture:** A single `Location` type (`{ name, placeId, lat, lng }`) flows through data model, API, and UI. `user.location` is the source of truth, updated via `PATCH /users/me`. A reusable `CityPicker` bottom sheet component (backed by Google Places Autocomplete) is used at all 5 touchpoints.

**Tech Stack:** React Native (Expo), NativeWind, `@gorhom/bottom-sheet` v5, Google Places Autocomplete API (HTTP), TypeScript

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `apps/mobile/lib/types.ts` | Add `Location` type, add `location?` to `Product` |
| Modify | `apps/mobile/features/sell/types.ts` | Add `location` to `SellFormData` |
| Modify | `apps/mobile/features/sell/context/SellFormContext.tsx` | Add `location: null` to `initialFormData` |
| Modify | `apps/mobile/lib/api.ts` | Add `location` to `VerifiedUser`, update `updateProfile` signature |
| Modify | `apps/mobile/context/AuthContext.tsx` | Add `location` to `User`, add `updateUser` method |
| Create | `apps/mobile/lib/googlePlaces.ts` | HTTP wrapper for Google Places Autocomplete |
| Modify | `apps/mobile/.env.local` | Add `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` |
| Modify | `apps/mobile/app/_layout.tsx` | Add `BottomSheetModalProvider` |
| Create | `apps/mobile/features/shared/components/CityPicker.tsx` | Reusable city picker bottom sheet |
| Modify | `apps/mobile/features/auth/screens/CompleteProfileScreen.tsx` | Add required location field |
| Modify | `apps/mobile/features/sell/components/ProductInfoStep.tsx` | Add location field (defaults to user's city) |
| Modify | `apps/mobile/features/search/components/ProductCard.tsx` | Show city name below seller |
| Modify | `apps/mobile/lib/mockData.ts` | Add location to mock products |
| Modify | `apps/mobile/features/search/SearchProductsScreen.tsx` | Add location icon button + context text |
| Modify | `apps/mobile/features/settings/components/ProfileSettings.tsx` | Add location field |

---

## Task 1: Add `Location` type, update `Product`, `SellFormData`, and `initialFormData`

**Files:**
- Modify: `apps/mobile/lib/types.ts`
- Modify: `apps/mobile/features/sell/types.ts`
- Modify: `apps/mobile/features/sell/context/SellFormContext.tsx`

- [ ] **Step 1: Add `Location` interface and update `Product` in `lib/types.ts`**

Add after the existing imports (top of file, before `User`):

```ts
export interface Location {
  name: string;
  placeId: string;
  lat: number;
  lng: number;
}
```

Add `location` to the `Product` interface (after `category?`):

```ts
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  seller?: string;
  sellerId?: string;
  category?: string;
  location?: Location;
}
```

- [ ] **Step 2: Add `location` to `SellFormData` in `features/sell/types.ts`**

Add `import type { Location } from '@/lib/types';` at the top, then add to the interface:

```ts
import type { ProductCategory, ProductCondition } from '@/lib/types';
import type { Location } from '@/lib/types';

export interface SellFormData {
  photos: string[];
  category: ProductCategory | '';
  condition: ProductCondition | '';
  name: string;
  price: number;
  description: string;
  location: Location | null;
}
```

- [ ] **Step 3: Run type check — expect an error in `SellFormContext`**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected error: `Property 'location' is missing in type '{ photos: ...; }' but required in type 'SellFormData'` in `SellFormContext.tsx`.

- [ ] **Step 4: Fix `initialFormData` in `features/sell/context/SellFormContext.tsx`**

Change `initialFormData` to add `location: null`:

```ts
const initialFormData: SellFormData = {
  photos: [],
  category: '',
  condition: '',
  name: '',
  price: 0,
  description: '',
  location: null,
};
```

- [ ] **Step 5: Run type check — expect no errors**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no output (clean pass).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/types.ts apps/mobile/features/sell/types.ts apps/mobile/features/sell/context/SellFormContext.tsx
git commit -m "feat(mobile): add Location type to types, SellFormData, and Product"
```

---

## Task 2: Update `lib/api.ts` — add `location` to `VerifiedUser` and `updateProfile`

**Files:**
- Modify: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Update `lib/api.ts`**

Replace the entire file content:

```ts
import type { Location } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function requestOtp(email: string): Promise<void> {
  await post('/auth/otp/request', { email });
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; user: VerifiedUser }> {
  return post('/auth/otp/verify', { email, code });
}

export async function updateProfile(
  token: string,
  data: {
    name?: string;
    gender?: 'male' | 'female';
    phone?: string;
    location?: Location;
  },
): Promise<VerifiedUser> {
  const res = await fetch(`${BASE}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<VerifiedUser>;
}
```

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/api.ts
git commit -m "feat(mobile): add location to VerifiedUser and updateProfile API"
```

---

## Task 3: Add `location` and `updateUser` to `AuthContext`

**Files:**
- Modify: `apps/mobile/context/AuthContext.tsx`

- [ ] **Step 1: Replace `context/AuthContext.tsx`**

```ts
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Location } from '@/lib/types';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = user !== null;

  const login = useCallback((userData: User, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, isLoading, login, logout, updateUser }}>
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

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: errors about `location` being missing wherever `User` objects are constructed — particularly in `OtpScreen.tsx` where `verifyOtp` returns a `VerifiedUser` that's passed to `login`. Fix those by ensuring the spread or assignment includes `location: null` as a fallback where needed.

Look for errors in `app/auth/otp.tsx` or any file calling `login(...)`. Open that file and add `location: user.location ?? null` to the object passed to `login`.

Check `apps/mobile/app/auth/otp.tsx`:

```ts
// If it constructs a User object manually, add location: null
// If it passes the VerifiedUser directly, it should work since VerifiedUser now has location
```

- [ ] **Step 3: Run type check again until clean**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/context/AuthContext.tsx apps/mobile/app/auth/otp.tsx
git commit -m "feat(mobile): add location and updateUser to AuthContext"
```

---

## Task 4: Create `lib/googlePlaces.ts` and add env var

**Files:**
- Create: `apps/mobile/lib/googlePlaces.ts`
- Modify: `apps/mobile/.env.local`

- [ ] **Step 1: Add the API key placeholder to `.env.local`**

Open `apps/mobile/.env.local` and add:

```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

To get a real key: Google Cloud Console → Enable "Places API (New)" → Create API Key → Restrict to Places API.

- [ ] **Step 2: Create `apps/mobile/lib/googlePlaces.ts`**

```ts
import type { Location } from '@/lib/types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
const BASE = 'https://maps.googleapis.com/maps/api/place';

export interface PlaceSuggestion {
  name: string;
  placeId: string;
}

export async function searchCities(query: string): Promise<PlaceSuggestion[]> {
  if (query.length < 2) return [];
  const url =
    `${BASE}/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&types=(cities)` +
    `&components=country:id` +
    `&language=id` +
    `&key=${API_KEY}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    predictions: Array<{
      place_id: string;
      structured_formatting: { main_text: string };
    }>;
  };
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
  return (data.predictions ?? []).map((p) => ({
    name: p.structured_formatting.main_text,
    placeId: p.place_id,
  }));
}

export async function getCityLocation(placeId: string, name: string): Promise<Location> {
  const url =
    `${BASE}/details/json` +
    `?place_id=${placeId}` +
    `&fields=geometry` +
    `&key=${API_KEY}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    result: { geometry: { location: { lat: number; lng: number } } };
  };
  const { lat, lng } = data.result.geometry.location;
  return { name, placeId, lat, lng };
}
```

- [ ] **Step 3: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/lib/googlePlaces.ts
git commit -m "feat(mobile): add Google Places HTTP wrapper (searchCities, getCityLocation)"
```

---

## Task 5: Add `BottomSheetModalProvider` to root layout

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

`@gorhom/bottom-sheet` v5's `BottomSheetModal` requires `BottomSheetModalProvider` somewhere above it in the tree.

- [ ] **Step 1: Update `app/_layout.tsx`**

Add the import and wrap the `Stack` with the provider:

```tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { FjallaOne_400Regular } from "@expo-google-fonts/fjalla-one";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { FilterSheetProvider } from "@/features/search/context/FilterSheetContext";
import { AuthProvider } from "@/context/AuthContext";
import "../global.css";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Fjalla-One": FjallaOne_400Regular,
    "Plus-Jakarta": PlusJakartaSans_400Regular,
    "Plus-Jakarta-Medium": PlusJakartaSans_500Medium,
    "Plus-Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Plus-Jakarta-Bold": PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <FilterSheetProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(public)" />
                <Stack.Screen name="(protected)" />
                <Stack.Screen name="auth" />
              </Stack>
            </BottomSheetModalProvider>
          </FilterSheetProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): add BottomSheetModalProvider to root layout"
```

---

## Task 6: Create `CityPicker` component

**Files:**
- Create: `apps/mobile/features/shared/components/CityPicker.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p apps/mobile/features/shared/components
```

- [ ] **Step 2: Create `features/shared/components/CityPicker.tsx`**

```tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, CloseSquare } from '@solar-icons/react-native/Linear';
import { searchCities, getCityLocation } from '@/lib/googlePlaces';
import type { Location } from '@/lib/types';
import type { PlaceSuggestion } from '@/lib/googlePlaces';

interface CityPickerProps {
  value: Location | null;
  onSelect: (location: Location) => void;
  onClose: () => void;
}

export function CityPicker({ value, onSelect, onClose }: CityPickerProps) {
  const ref = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    ref.current?.present();
  }, []);

  const handleChangeText = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchCities(text);
      setSuggestions(results);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelect = useCallback(async (suggestion: PlaceSuggestion) => {
    const location = await getCityLocation(suggestion.placeId, suggestion.name);
    onSelect(location);
    ref.current?.dismiss();
  }, [onSelect]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['60%']}
      onDismiss={onClose}
      enablePanDownToClose
    >
      <BottomSheetView style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Kota</Text>
          <TouchableOpacity onPress={() => ref.current?.dismiss()}>
            <CloseSquare size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <MapPin size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Cari kota..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={handleChangeText}
            autoFocus
          />
          {isLoading && <ActivityIndicator size="small" color="#9CA3AF" />}
        </View>

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.resultText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length >= 2 && !isLoading ? (
              <Text style={styles.emptyText}>Kota tidak ditemukan</Text>
            ) : null
          }
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontFamily: 'Fjalla-One' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    height: 48, paddingHorizontal: 12, marginBottom: 12, backgroundColor: 'white',
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  resultText: { fontSize: 16, color: '#111827' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
});
```

- [ ] **Step 3: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/shared/components/CityPicker.tsx
git commit -m "feat(mobile): add CityPicker bottom sheet component"
```

---

## Task 7: Add location field to `CompleteProfileScreen`

**Files:**
- Modify: `apps/mobile/features/auth/screens/CompleteProfileScreen.tsx`

- [ ] **Step 1: Replace `features/auth/screens/CompleteProfileScreen.tsx`**

```tsx
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from '@solar-icons/react-native/Linear';
import { GenderSelector } from '../components/GenderSelector';
import { CityPicker } from '@/features/shared/components/CityPicker';
import { updateProfile, ApiError, type VerifiedUser } from '@/lib/api';
import type { Location } from '@/lib/types';

type LocalGender = 'pria' | 'wanita' | null;

interface CompleteProfileScreenProps {
  email: string;
  token: string;
  onSubmit: (user: VerifiedUser) => void;
}

export function CompleteProfileScreen({ email, token, onSubmit }: CompleteProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<LocalGender>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !gender || !location) return;
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfile(token, {
        name: name.trim(),
        gender: gender === 'pria' ? 'male' : 'female',
        phone: phone.trim(),
        location,
      });
      onSubmit({ ...updatedUser, location });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status < 500
          ? 'Terjadi kesalahan. Periksa data Anda.'
          : 'Server error. Coba beberapa saat lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = name.trim().length > 0 && phone.trim().length > 0 && gender !== null && location !== null;

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Lengkapi Profil
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Berikan informasi untuk melanjutkan
          </Text>

          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Nama Lengkap</Text>
            <View className="bg-white rounded-xl border border-gray-200" style={{ height: 52 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#9CA3AF"
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: 16,
                  paddingHorizontal: 16,
                  ...(Platform.OS === 'android'
                    ? { includeFontPadding: false, textAlignVertical: 'center' }
                    : {}),
                }}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Nomor Handphone</Text>
            <View className="bg-white rounded-xl border border-gray-200" style={{ height: 52 }}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Contoh: 08123456789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: 16,
                  paddingHorizontal: 16,
                  ...(Platform.OS === 'android'
                    ? { includeFontPadding: false, textAlignVertical: 'center' }
                    : {}),
                }}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Kota</Text>
            <TouchableOpacity
              onPress={() => setShowCityPicker(true)}
              className="bg-white rounded-xl border border-gray-200 flex-row items-center px-4"
              style={{ height: 52 }}
              activeOpacity={0.8}
            >
              <MapPin size={16} color={location ? '#155DFC' : '#9CA3AF'} />
              <Text
                className="flex-1 ml-2"
                style={{ fontSize: 16, color: location ? '#111827' : '#9CA3AF' }}
              >
                {location ? location.name : 'Pilih kota...'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Jenis Kelamin</Text>
            <GenderSelector value={gender} onChange={setGender} />
          </View>

          {error !== null && (
            <Text className="text-sm text-red-500 mb-4">{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className={`rounded-xl py-4 items-center ${isValid && !isLoading ? 'bg-black' : 'bg-gray-300'}`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-base font-semibold ${isValid && !isLoading ? 'text-white' : 'text-gray-500'}`}
            >
              {isLoading ? 'Menyimpan...' : 'Selesai'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showCityPicker && (
        <CityPicker
          value={location}
          onSelect={(loc) => { setLocation(loc); setShowCityPicker(false); }}
          onClose={() => setShowCityPicker(false)}
        />
      )}
    </View>
  );
}
```

Note: `onSubmit` is called with `{ ...updatedUser, location }` to ensure location is set locally even if backend hasn't been updated to return it yet.

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/auth/screens/CompleteProfileScreen.tsx
git commit -m "feat(mobile): add required location field to CompleteProfileScreen"
```

---

## Task 8: Add location field to `ProductInfoStep`

**Files:**
- Modify: `apps/mobile/features/sell/components/ProductInfoStep.tsx`

- [ ] **Step 1: Update `features/sell/components/ProductInfoStep.tsx`**

Add these imports at the top (after existing imports):

```tsx
import { useEffect, useState } from 'react';
import { MapPin } from '@solar-icons/react-native/Linear';
import { CityPicker } from '@/features/shared/components/CityPicker';
import { useAuth } from '@/context/AuthContext';
```

(Note: `useState` may already be imported — add only what's missing.)

Inside the component function, after `const insets = useSafeAreaInsets();`, add:

```tsx
const { user } = useAuth();
const [showCityPicker, setShowCityPicker] = useState(false);

useEffect(() => {
  if (!formData.location && user?.location) {
    onFormChange({ location: user.location });
  }
}, []);
```

Update `isLocationValid` and `canProceed`:

```tsx
const isNameValid = formData.name.length >= 3;
const isPriceValid = formData.price >= 1000;
const isLocationValid = formData.location !== null;
const canProceed = isDevMode || (isNameValid && isPriceValid && isLocationValid);
```

Add the location field in the JSX, after the Deskripsi `<View className="mb-5">` block and before the closing `</ScrollView>`:

```tsx
{/* Lokasi */}
<View className="mb-5">
  <Text className="text-sm font-medium text-gray-700 mb-2">
    Lokasi <Text className="text-red-500">*</Text>
  </Text>
  <TouchableOpacity
    onPress={() => setShowCityPicker(true)}
    className={INPUT_CONTAINER}
    style={{ height: INPUT_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}
    activeOpacity={0.8}
  >
    <MapPin size={16} color={formData.location ? '#155DFC' : '#9CA3AF'} />
    <Text
      className="flex-1 ml-2"
      style={{ fontSize: INPUT_FONT_SIZE, color: formData.location ? '#111827' : '#9CA3AF' }}
    >
      {formData.location ? formData.location.name : 'Pilih kota...'}
    </Text>
  </TouchableOpacity>
</View>
```

Add the `CityPicker` render after the closing `</ScrollView>` tag but inside the root `<View>`:

```tsx
{showCityPicker && (
  <CityPicker
    value={formData.location}
    onSelect={(loc) => { onFormChange({ location: loc }); setShowCityPicker(false); }}
    onClose={() => setShowCityPicker(false)}
  />
)}
```

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/sell/components/ProductInfoStep.tsx
git commit -m "feat(mobile): add location field to ProductInfoStep, defaults to user's city"
```

---

## Task 9: Show location in `ProductCard` and add mock location data

**Files:**
- Modify: `apps/mobile/features/search/components/ProductCard.tsx`
- Modify: `apps/mobile/lib/mockData.ts`

- [ ] **Step 1: Update `ProductCard` to show location**

Add `MapPin` import:

```tsx
import { ArrowRight, User, MapPin } from "@solar-icons/react-native/Linear";
```

After the seller row (`<View className="flex-row items-center justify-between">`), add:

```tsx
{product.location && (
  <View className="flex-row items-center mt-1">
    <MapPin size={10} color="#9CA3AF" />
    <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
      {product.location.name}
    </Text>
  </View>
)}
```

The full bottom section of the card becomes:

```tsx
<View className="mt-2">
  <Text className="font-medium mb-1" numberOfLines={2}>
    {product.name}
  </Text>
  <Text className="text-sm mb-2">{formatPrice(product.price)}</Text>
  <TouchableOpacity
    className="flex-row items-center"
    onPress={onSellerPress}
    hitSlop={{ top: 10, bottom: 10, left: 0, right: 0 }}
  >
    <User size={12} color="#9CA3AF" />
    <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
      {product.seller}
    </Text>
  </TouchableOpacity>
  {product.location && (
    <View className="flex-row items-center mt-1">
      <MapPin size={10} color="#9CA3AF" />
      <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
        {product.location.name}
      </Text>
    </View>
  )}
</View>
```

- [ ] **Step 2: Add location to `lib/mockData.ts`**

```ts
import type { Product, Location } from '@/lib/types';

const jakarta: Location = { name: 'Jakarta', placeId: 'mock-jakarta', lat: -6.2088, lng: 106.8456 };
const surabaya: Location = { name: 'Surabaya', placeId: 'mock-surabaya', lat: -7.2575, lng: 112.7521 };
const bandung: Location = { name: 'Bandung', placeId: 'mock-bandung', lat: -6.9175, lng: 107.6191 };
const medan: Location = { name: 'Medan', placeId: 'mock-medan', lat: 3.5952, lng: 98.6722 };

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Sepatu Sneakers Pria",
    price: 250000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    seller: "Andi",
    sellerId: "seller-1",
    category: "Fashion",
    location: jakarta,
  },
  {
    id: "2",
    name: "Tas Ransel Laptop",
    price: 180000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    seller: "Budi",
    sellerId: "seller-2",
    category: "Aksesoris",
    location: bandung,
  },
  {
    id: "3",
    name: "Kemeja Flannel",
    price: 150000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
    seller: "Citra",
    sellerId: "seller-3",
    category: "Fashion",
    location: surabaya,
  },
  {
    id: "4",
    name: "Jam Tangan Analog",
    price: 350000,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
    seller: "Dian",
    sellerId: "seller-4",
    category: "Aksesoris",
    location: jakarta,
  },
  {
    id: "5",
    name: "Hoodie Oversized",
    price: 200000,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
    seller: "Eka",
    sellerId: "seller-5",
    category: "Fashion",
    location: bandung,
  },
  {
    id: "6",
    name: "Topi Baseball",
    price: 75000,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
    seller: "Fani",
    sellerId: "seller-6",
    category: "Aksesoris",
    location: medan,
  },
  {
    id: "7",
    name: "Kaos Polos Premium",
    price: 85000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    seller: "Gina",
    sellerId: "seller-7",
    category: "Fashion",
    location: surabaya,
  },
  {
    id: "8",
    name: "Dompet Kulit Pria",
    price: 120000,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    seller: "Hadi",
    sellerId: "seller-8",
    category: "Aksesoris",
    location: jakarta,
  },
  {
    id: "9",
    name: "Celana Jeans Slim",
    price: 175000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
    seller: "Irma",
    sellerId: "seller-9",
    category: "Fashion",
    location: bandung,
  },
  {
    id: "10",
    name: "Kacamata Fashion",
    price: 95000,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    seller: "Joko",
    sellerId: "seller-10",
    category: "Aksesoris",
    location: surabaya,
  },
  {
    id: "11",
    name: "Jaket Denim Classic",
    price: 280000,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop",
    seller: "Kirana",
    sellerId: "seller-11",
    category: "Fashion",
    location: jakarta,
  },
  {
    id: "12",
    name: "Ikat Pinggang Kulit",
    price: 65000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    seller: "Leo",
    sellerId: "seller-12",
    category: "Aksesoris",
    location: medan,
  },
];
```

- [ ] **Step 3: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/search/components/ProductCard.tsx apps/mobile/lib/mockData.ts
git commit -m "feat(mobile): show location in ProductCard, add location to mock data"
```

---

## Task 10: Add location picker to `SearchProductsScreen`

**Files:**
- Modify: `apps/mobile/features/search/SearchProductsScreen.tsx`

- [ ] **Step 1: Add imports to `SearchProductsScreen.tsx`**

Add to existing imports:

```tsx
import { MapPin } from "@solar-icons/react-native/Linear";
import { CityPicker } from "@/features/shared/components/CityPicker";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import type { Location } from "@/lib/types";
```

- [ ] **Step 2: Add state and handlers inside the component**

After `const { openFilterSheet } = useFilterSheet();`, add:

```tsx
const { user, token, updateUser } = useAuth();
const [showCityPicker, setShowCityPicker] = useState(false);

const handleLocationSelect = useCallback(async (location: Location) => {
  setShowCityPicker(false);
  if (!token) return;
  try {
    const updatedUser = await updateProfile(token, { location });
    updateUser({ ...updatedUser, location });
  } catch {
    // best-effort — location is already dismissed
  }
}, [token, updateUser]);
```

- [ ] **Step 3: Add `MapPin` button to the header row**

In the header `<View className="flex-row items-center gap-2">`, add a `MapPin` button between the `ArrowLeft` button and the search bar:

```tsx
<View className="flex-row items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    icon={<ArrowLeft size={18} color="#374151" />}
    onPress={onBack}
  />

  <Button
    variant="ghost"
    size="sm"
    icon={<MapPin size={18} color={user?.location ? '#155DFC' : '#6B7280'} />}
    onPress={() => setShowCityPicker(true)}
  />

  <View className="flex-1">
    <SearchBar
      value={searchQuery}
      onChangeText={handleChangeText}
      onSubmit={handleSearch}
      autoFocus={!hasSubmitted}
    />
  </View>
  {hasSubmitted && (
    <TouchableOpacity
      className="items-center justify-center bg-white rounded-xl border border-gray-200"
      style={{ width: 40, height: 40 }}
      onPress={() => openFilterSheet(handleFilter, { sortBy })}
    >
      <Filter size={20} color="#374151" />
    </TouchableOpacity>
  )}
</View>
```

- [ ] **Step 4: Add location context text below the header**

After the closing `</View>` of the header (the `px-5 pb-2` View), add:

```tsx
{hasSubmitted && user?.location && (
  <View className="px-5 pb-2">
    <Text className="text-xs text-gray-500">
      Menampilkan produk di{' '}
      <Text className="font-semibold text-gray-700">{user.location.name}</Text>
    </Text>
  </View>
)}
```

- [ ] **Step 5: Add `CityPicker` at the end of the root View**

Before the closing `</View>` of the root component:

```tsx
{showCityPicker && (
  <CityPicker
    value={user?.location ?? null}
    onSelect={handleLocationSelect}
    onClose={() => setShowCityPicker(false)}
  />
)}
```

- [ ] **Step 6: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/features/search/SearchProductsScreen.tsx
git commit -m "feat(mobile): add location picker to search header, show active city context"
```

---

## Task 11: Add location field to `ProfileSettings`

**Files:**
- Modify: `apps/mobile/features/settings/components/ProfileSettings.tsx`

- [ ] **Step 1: Replace `features/settings/components/ProfileSettings.tsx`**

```tsx
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { User, MapPin } from "@solar-icons/react-native/Linear";
import { CityPicker } from "@/features/shared/components/CityPicker";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import type { Location } from "@/lib/types";

const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;

export function ProfileSettings() {
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Nama tidak boleh kosong");
      return;
    }
    if (!token) return;
    setIsLoading(true);
    try {
      const updatedUser = await updateProfile(token, { name: name.trim() });
      updateUser({ ...updatedUser, location: user?.location ?? null });
      Alert.alert("Sukses", "Profil berhasil diperbarui");
    } catch {
      Alert.alert("Error", "Gagal menyimpan profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (location: Location) => {
    setShowCityPicker(false);
    if (!token) return;
    try {
      const updatedUser = await updateProfile(token, { location });
      updateUser({ ...updatedUser, location });
    } catch {
      // best-effort
    }
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Avatar Section */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
          <User size={40} color="#9CA3AF" />
        </View>
        <TouchableOpacity className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Foto</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Nama Lengkap</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Masukkan nama lengkap"
            className="border border-gray-300 rounded-xl bg-white px-4 text-gray-900"
            placeholderTextColor="#9CA3AF"
            style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            value={email}
            editable={false}
            className="border border-gray-200 rounded-xl bg-gray-50 px-4 text-gray-400"
            placeholderTextColor="#9CA3AF"
            style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Kota</Text>
          <TouchableOpacity
            onPress={() => setShowCityPicker(true)}
            className="border border-gray-300 rounded-xl bg-white px-4 flex-row items-center"
            style={{ height: INPUT_HEIGHT }}
            activeOpacity={0.8}
          >
            <MapPin size={16} color={user?.location ? '#155DFC' : '#9CA3AF'} />
            <Text
              className="flex-1 ml-2"
              style={{
                fontSize: INPUT_FONT_SIZE,
                color: user?.location ? '#111827' : '#9CA3AF',
              }}
            >
              {user?.location ? user.location.name : 'Belum diatur'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isLoading}
        className={`mt-6 rounded-xl py-4 items-center ${isLoading ? "bg-gray-300" : "bg-black"}`}
      >
        <Text className={`text-base font-medium ${isLoading ? "text-gray-500" : "text-white"}`}>
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Text>
      </TouchableOpacity>

      {showCityPicker && (
        <CityPicker
          value={user?.location ?? null}
          onSelect={handleLocationSelect}
          onClose={() => setShowCityPicker(false)}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 2: Run final type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors. All 11 tasks complete.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/settings/components/ProfileSettings.tsx
git commit -m "feat(mobile): add location field to ProfileSettings, wire to AuthContext"
```

---

## Manual Verification Checklist

After all tasks are complete, run `npx expo start` and verify:

- [ ] **Onboarding**: Complete profile form shows a "Kota" field. Tapping opens `CityPicker`. Typing 2+ chars shows city suggestions from Google. Selecting a city fills the field. Submit button disabled until city is selected.
- [ ] **Sell flow**: `ProductInfoStep` has a "Lokasi" field pre-filled with user's city. Can be overridden by tapping and picking a different city.
- [ ] **Product cards**: Each card shows a pin icon + city name below the seller name.
- [ ] **Search screen**: Map pin icon appears in the header left of the search bar. Tapping opens `CityPicker`. After selecting, "Menampilkan produk di [city]" appears below the search bar when results are shown. The pin icon turns blue when a city is set.
- [ ] **Settings → Profil**: "Kota" field shows current city (or "Belum diatur"). Tapping opens `CityPicker`. Selecting a city updates it immediately.
