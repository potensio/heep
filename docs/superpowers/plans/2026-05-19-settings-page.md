# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive settings page with nested navigation for profile, phone, security, notifications, and shop settings.

**Architecture:** File-based routing with Expo Router for settings sub-pages. Main settings menu as a flat list of categories. Each sub-page in its own route file under `app/settings/`. Reusable components in `features/settings/`.

**Tech Stack:** React Native, Expo Router, NativeWind (Tailwind), Solar Icons, TypeScript

**Design Spec:** `docs/superpowers/specs/2026-05-19-settings-page-design.md`

---

## File Structure

**New Files:**
- `features/settings/SettingsScreen.tsx` - Main settings menu
- `features/settings/components/SettingsItem.tsx` - Reusable list item
- `features/settings/components/ProfileSettings.tsx` - Profile form
- `features/settings/components/PhoneSettings.tsx` - Phone management
- `features/settings/components/SecuritySettings.tsx` - Password change
- `features/settings/components/NotificationSettings.tsx` - Toggle preferences
- `features/settings/components/ShopSettings.tsx` - Shop settings form
- `app/settings/profil.tsx` - Profile route
- `app/settings/handphone.tsx` - Phone route
- `app/settings/keamanan.tsx` - Security route
- `app/settings/notifikasi.tsx` - Notifications route
- `app/settings/toko.tsx` - Shop route
- `app/settings/_layout.tsx` - Settings stack layout

**Modified Files:**
- `app/(tabs)/akun.tsx` - Replace placeholder with SettingsScreen

---

## Task 1: Create SettingsItem Component

**Files:**
- Create: `features/settings/components/SettingsItem.tsx`

- [ ] **Step 1: Create SettingsItem component**

Create file with reusable list item component:

```typescript
import { TouchableOpacity, Text, View } from "react-native";
import { ChevronRight } from "@solar-icons/react-native/Linear";
import type { ReactNode } from "react";

interface SettingsItemProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

export function SettingsItem({ icon, label, onPress }: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 px-4 bg-white rounded-xl active:bg-gray-50"
    >
      <View className="w-6 items-center">{icon}</View>
      <Text className="flex-1 text-base text-gray-800 ml-3">{label}</Text>
      <ChevronRight size={20} className="text-gray-400" />
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/settings/components/SettingsItem.tsx
git commit -m "feat(settings): add SettingsItem component"
```

---

## Task 2: Create Main Settings Screen

**Files:**
- Create: `features/settings/SettingsScreen.tsx`
- Modify: `app/(tabs)/akun.tsx`

- [ ] **Step 1: Create SettingsScreen component**

Create file with main settings menu:

```typescript
import { View, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SettingsItem } from "./components/SettingsItem";
import { User, Phone, Shield, Bell, Store } from "@solar-icons/react-native/Linear";

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top > 0 ? insets.top : 24 }}
      >
        <View className="px-5 gap-6">
          {/* Header */}
          <Text className="text-2xl font-heading font-medium">Pengaturan</Text>

          {/* Profile & Account Section */}
          <View className="gap-2">
            <Text className="text-sm text-gray-500 px-1 mb-1">Akun & Profil</Text>
            <View className="gap-2">
              <SettingsItem
                icon={<User size={20} className="text-gray-700" />}
                label="Profil"
                onPress={() => router.push("/settings/profil")}
              />
              <SettingsItem
                icon={<Phone size={20} className="text-gray-700" />}
                label="Nomor Handphone"
                onPress={() => router.push("/settings/handphone")}
              />
              <SettingsItem
                icon={<Shield size={20} className="text-gray-700" />}
                label="Keamanan"
                onPress={() => router.push("/settings/keamanan")}
              />
            </View>
          </View>

          {/* App Settings Section */}
          <View className="gap-2">
            <Text className="text-sm text-gray-500 px-1 mb-1">Aplikasi</Text>
            <View className="gap-2">
              <SettingsItem
                icon={<Bell size={20} className="text-gray-700" />}
                label="Notifikasi"
                onPress={() => router.push("/settings/notifikasi")}
              />
            </View>
          </View>

          {/* Seller Settings Section */}
          <View className="gap-2">
            <Text className="text-sm text-gray-500 px-1 mb-1">Toko</Text>
            <View className="gap-2">
              <SettingsItem
                icon={<Store size={20} className="text-gray-700" />}
                label="Toko"
                onPress={() => router.push("/settings/toko")}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Update akun.tsx to use SettingsScreen**

Replace content of `app/(tabs)/akun.tsx`:

```typescript
import { SettingsScreen } from "@/features/settings/SettingsScreen";

export default function AccountTab() {
  return <SettingsScreen />;
}
```

- [ ] **Step 3: Commit**

```bash
git add features/settings/SettingsScreen.tsx app/(tabs)/akun.tsx
git commit -m "feat(settings): add main settings screen"
```

---

## Task 3: Create Settings Layout Route

**Files:**
- Create: `app/settings/_layout.tsx`

- [ ] **Step 1: Create settings stack layout**

Create file with stack navigator for settings pages:

```typescript
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTintColor: "#0A0A0A",
        headerTitleStyle: {
          fontWeight: "500",
        },
        headerBackTitle: "Kembali",
      }}
    >
      <Stack.Screen name="profil" options={{ title: "Profil" }} />
      <Stack.Screen name="handphone" options={{ title: "Nomor Handphone" }} />
      <Stack.Screen name="keamanan" options={{ title: "Keamanan" }} />
      <Stack.Screen name="notifikasi" options={{ title: "Notifikasi" }} />
      <Stack.Screen name="toko" options={{ title: "Toko" }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/_layout.tsx
git commit -m "feat(settings): add settings stack layout"
```

---

## Task 4: Create Profile Settings Page

**Files:**
- Create: `features/settings/components/ProfileSettings.tsx`
- Create: `app/settings/profil.tsx`

- [ ] **Step 1: Create ProfileSettings component**

Create file with profile editing form:

```typescript
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { User } from "@solar-icons/react-native/Linear";

export function ProfileSettings() {
  const [name, setName] = useState("Andi Pratama");
  const [email, setEmail] = useState("andi.pratama@email.com");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Nama tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    // Simulate save
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Sukses", "Profil berhasil diperbarui");
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Avatar Section */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
          <User size={40} className="text-gray-400" />
        </View>
        <TouchableOpacity className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Foto</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-sm text-gray-600 mb-1">Nama Lengkap</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Masukkan nama lengkap"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View>
          <Text className="text-sm text-gray-600 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Masukkan email"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
            placeholderTextColor="#9CA3AF"
          />
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
    </View>
  );
}
```

- [ ] **Step 2: Create profil route**

Create file:

```typescript
import { ProfileSettings } from "@/features/settings/components/ProfileSettings";

export default function ProfileScreen() {
  return <ProfileSettings />;
}
```

- [ ] **Step 3: Commit**

```bash
git add features/settings/components/ProfileSettings.tsx app/settings/profil.tsx
git commit -m "feat(settings): add profile settings page"
```

---

## Task 5: Create Phone Settings Page

**Files:**
- Create: `features/settings/components/PhoneSettings.tsx`
- Create: `app/settings/handphone.tsx`

- [ ] **Step 1: Create PhoneSettings component**

Create file with phone number display and change option:

```typescript
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Phone } from "@solar-icons/react-native/Linear";

export function PhoneSettings() {
  const [phoneNumber] = useState("+62 812-3456-7890");

  const handleChangePhone = () => {
    Alert.alert(
      "Ubah Nomor",
      "Fitur verifikasi nomor handphone akan segera tersedia.",
      [{ text: "OK" }]
    );
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Current Phone Display */}
      <View className="bg-white rounded-xl p-5 mb-4">
        <Text className="text-sm text-gray-600 mb-2">Nomor Handphone Saat Ini</Text>
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Phone size={20} className="text-gray-600" />
          </View>
          <Text className="text-lg font-medium">{phoneNumber}</Text>
        </View>
      </View>

      {/* Change Button */}
      <TouchableOpacity
        onPress={handleChangePhone}
        className="bg-white rounded-xl py-4 items-center border border-gray-200"
      >
        <Text className="text-base font-medium text-gray-800">Ubah Nomor Handphone</Text>
      </TouchableOpacity>

      {/* Info */}
      <Text className="text-sm text-gray-500 mt-4 text-center">
        Nomor handphone digunakan untuk verifikasi dan pemulihan akun.
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create handphone route**

Create file:

```typescript
import { PhoneSettings } from "@/features/settings/components/PhoneSettings";

export default function HandphoneScreen() {
  return <PhoneSettings />;
}
```

- [ ] **Step 3: Commit**

```bash
git add features/settings/components/PhoneSettings.tsx app/settings/handphone.tsx
git commit -m "feat(settings): add phone settings page"
```

---

## Task 6: Create Security Settings Page

**Files:**
- Create: `features/settings/components/SecuritySettings.tsx`
- Create: `app/settings/keamanan.tsx`

- [ ] **Step 1: Create SecuritySettings component**

Create file with password change form:

```typescript
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Eye, EyeSlash } from "@solar-icons/react-native/Linear";

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password baru minimal 8 karakter");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Sukses", "Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="text-sm text-gray-600 mb-4">Ubah Password</Text>

      <View className="gap-4">
        {/* Current Password */}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Password Saat Ini</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Masukkan password saat ini"
              secureTextEntry={!showCurrentPassword}
              className="flex-1 px-4 py-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="px-3"
            >
              {showCurrentPassword ? (
                <EyeSlash size={20} className="text-gray-400" />
              ) : (
                <Eye size={20} className="text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Password Baru</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Masukkan password baru"
              secureTextEntry={!showNewPassword}
              className="flex-1 px-4 py-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="px-3"
            >
              {showNewPassword ? (
                <EyeSlash size={20} className="text-gray-400" />
              ) : (
                <Eye size={20} className="text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Konfirmasi Password Baru</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmasi password baru"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 px-4 py-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="px-3"
            >
              {showConfirmPassword ? (
                <EyeSlash size={20} className="text-gray-400" />
              ) : (
                <Eye size={20} className="text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleChangePassword}
        disabled={isLoading}
        className={`mt-6 rounded-xl py-4 items-center ${isLoading ? "bg-gray-300" : "bg-black"}`}
      >
        <Text className={`text-base font-medium ${isLoading ? "text-gray-500" : "text-white"}`}>
          {isLoading ? "Menyimpan..." : "Ubah Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Create keamanan route**

Create file:

```typescript
import { SecuritySettings } from "@/features/settings/components/SecuritySettings";

export default function KeamananScreen() {
  return <SecuritySettings />;
}
```

- [ ] **Step 3: Commit**

```bash
git add features/settings/components/SecuritySettings.tsx app/settings/keamanan.tsx
git commit -m "feat(settings): add security settings page"
```

---

## Task 7: Create Notification Settings Page

**Files:**
- Create: `features/settings/components/NotificationSettings.tsx`
- Create: `app/settings/notifikasi.tsx`

- [ ] **Step 1: Create NotificationSettings component**

Create file with toggle switches:

```typescript
import { View, Text, Switch, ScrollView } from "react-native";
import { useState } from "react";

export function NotificationSettings() {
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(false);

  return (
    <ScrollView className="flex-1 bg-background p-5">
      <Text className="text-sm text-gray-600 mb-4">
        Kelola preferensi notifikasi Anda
      </Text>

      <View className="gap-4">
        {/* Order Notifications */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-gray-800">Pesanan</Text>
            <Text className="text-sm text-gray-500">
              Status pesanan, pengiriman, dan transaksi
            </Text>
          </View>
          <Switch
            value={orderNotifications}
            onValueChange={setOrderNotifications}
            trackColor={{ false: "#E5E7EB", true: "#10B981" }}
            thumbColor={orderNotifications ? "#fff" : "#fff"}
          />
        </View>

        {/* Chat Notifications */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-gray-800">Chat</Text>
            <Text className="text-sm text-gray-500">
              Pesan dari pembeli dan penjual
            </Text>
          </View>
          <Switch
            value={chatNotifications}
            onValueChange={setChatNotifications}
            trackColor={{ false: "#E5E7EB", true: "#10B981" }}
            thumbColor={chatNotifications ? "#fff" : "#fff"}
          />
        </View>

        {/* Promo Notifications */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-gray-800">Promosi</Text>
            <Text className="text-sm text-gray-500">
              Penawaran, diskon, dan promosi menarik
            </Text>
          </View>
          <Switch
            value={promoNotifications}
            onValueChange={setPromoNotifications}
            trackColor={{ false: "#E5E7EB", true: "#10B981" }}
            thumbColor={promoNotifications ? "#fff" : "#fff"}
          />
        </View>
      </View>

      <Text className="text-xs text-gray-400 mt-6 text-center">
        Perubahan akan tersimpan otomatis
      </Text>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Create notifikasi route**

Create file:

```typescript
import { NotificationSettings } from "@/features/settings/components/NotificationSettings";

export default function NotifikasiScreen() {
  return <NotificationSettings />;
}
```

- [ ] **Step 3: Commit**

```bash
git add features/settings/components/NotificationSettings.tsx app/settings/notifikasi.tsx
git commit -m "feat(settings): add notification settings page"
```

---

## Task 8: Create Shop Settings Page

**Files:**
- Create: `features/settings/components/ShopSettings.tsx`
- Create: `app/settings/toko.tsx`

- [ ] **Step 1: Create ShopSettings component**

Create file with shop settings form:

```typescript
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Store } from "@solar-icons/react-native/Linear";

export function ShopSettings() {
  const [shopName, setShopName] = useState("Toko Andi Official");
  const [description, setDescription] = useState("Menjual produk fashion original dan berkualitas");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert("Error", "Nama toko tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    // Simulate save
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Sukses", "Pengaturan toko berhasil disimpan");
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Shop Logo/Avatar */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
          <Store size={40} className="text-gray-400" />
        </View>
        <TouchableOpacity className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Logo</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-sm text-gray-600 mb-1">Nama Toko</Text>
          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="Masukkan nama toko"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View>
          <Text className="text-sm text-gray-600 mb-1">Deskripsi</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ceritakan tentang toko Anda"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200 min-h-[100px]"
            placeholderTextColor="#9CA3AF"
          />
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
    </View>
  );
}
```

- [ ] **Step 2: Create toko route**

Create file:

```typescript
import { ShopSettings } from "@/features/settings/components/ShopSettings";

export default function TokoScreen() {
  return <ShopSettings />;
}
```

- [ ] **Step 3: Commit**

```bash
git add features/settings/components/ShopSettings.tsx app/settings/toko.tsx
git commit -m "feat(settings): add shop settings page"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run app and verify navigation**

Start the development server:

```bash
npm start
```

Navigate through all settings pages:
- Akun tab → Settings menu loads
- Tap each item → Each sub-page opens with correct title
- Back button → Returns to settings menu

- [ ] **Step 2: Test form functionality**

On each form page:
- Edit fields
- Tap save button
- Verify validation and success messages
- Test toggle switches on notifications page

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(settings): complete settings page implementation"
```
