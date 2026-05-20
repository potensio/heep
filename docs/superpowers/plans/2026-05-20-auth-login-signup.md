# Auth Login/Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build static login/signup flow with phone number and OTP verification for BantuJual marketplace app.

**Architecture:** Phone-first authentication flow with 4 screens - phone input, OTP verification, profile completion (for new users), and success. Uses Expo Router for navigation, NativeWind for styling. No backend integration yet - static with mock data.

**Tech Stack:** React Native, Expo Router, NativeWind (Tailwind), TypeScript, @solar-icons/react-native

---

## File Structure

```
app/
├── auth/
│   ├── _layout.tsx           # Stack navigator for auth flow
│   ├── index.tsx             # Phone input screen
│   ├── otp.tsx               # OTP verification screen
│   ├── complete-profile.tsx  # New user profile form
│   └── success.tsx           # Welcome/success screen

features/
├── auth/
│   ├── components/
│   │   ├── PhoneInput.tsx    # Phone number input with +62 prefix
│   │   ├── OtpInput.tsx      # 6-digit OTP input boxes
│   │   └── GenderSelector.tsx # Pria/Wanita selection buttons
│   ├── screens/
│   │   ├── PhoneScreen.tsx   # Phone input screen
│   │   ├── OtpScreen.tsx     # OTP verification screen
│   │   ├── CompleteProfileScreen.tsx # Profile form screen
│   │   └── SuccessScreen.tsx # Success screen
│   └── index.ts              # Barrel export
```

---

## Task 1: Create Auth Feature Folder Structure

**Files:**
- Create: `features/auth/index.ts`
- Create: `features/auth/screens/PhoneScreen.tsx`
- Create: `features/auth/screens/OtpScreen.tsx`
- Create: `features/auth/screens/CompleteProfileScreen.tsx`
- Create: `features/auth/screens/SuccessScreen.tsx`
- Create: `features/auth/components/PhoneInput.tsx`
- Create: `features/auth/components/OtpInput.tsx`
- Create: `features/auth/components/GenderSelector.tsx`

- [ ] **Step 1: Create auth feature directory and barrel export**

```bash
mkdir -p features/auth/screens features/auth/components
```

```typescript
// features/auth/index.ts
export { PhoneScreen } from './screens/PhoneScreen';
export { OtpScreen } from './screens/OtpScreen';
export { CompleteProfileScreen } from './screens/CompleteProfileScreen';
export { SuccessScreen } from './screens/SuccessScreen';
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/
git commit -m "feat(auth): create auth feature folder structure"
```

---

## Task 2: Build PhoneInput Component

**Files:**
- Create: `features/auth/components/PhoneInput.tsx`

- [ ] **Step 1: Create PhoneInput component**

```typescript
// features/auth/components/PhoneInput.tsx
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChangeText, onSubmit, disabled }: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (value.length >= 10 && onSubmit) {
      onSubmit();
    }
  };

  return (
    <View className="flex-row items-center">
      <View
        className={`
          flex-row items-center bg-white rounded-xl border
          ${isFocused ? 'border-primary' : 'border-gray-200'}
        `}
        style={{ flex: 1 }}
      >
        <TouchableOpacity className="px-4 py-4 border-r border-gray-200">
          <Text className="text-base text-gray-800 font-medium">+62</Text>
        </TouchableOpacity>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          placeholder="812 3456 7890"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={13}
          editable={!disabled}
          className="flex-1 px-4 py-4 text-base"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/components/PhoneInput.tsx
git commit -m "feat(auth): add PhoneInput component with +62 prefix"
```

---

## Task 3: Build OtpInput Component

**Files:**
- Create: `features/auth/components/OtpInput.tsx`

- [ ] **Step 1: Create OtpInput component with 6 boxes**

```typescript
// features/auth/components/OtpInput.tsx
import { View, Text, TextInput, useRef, useEffect } from 'react-native';
import { useState, createRef } from 'react';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChangeText, length = 6, disabled }: OtpInputProps) {
  const inputRefs = Array.from({ length }, () => createRef<TextInput>());

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    if (digit.length > 1) {
      // Handle paste - take only the relevant digits
      const newOtp = digit.slice(0, length);
      onChangeText(newOtp);
      // Focus the last filled box or the next empty one
      const nextIndex = Math.min(newOtp.length, length - 1);
      inputRefs[nextIndex]?.current?.focus();
      return;
    }

    // Single digit input
    const currentValue = value || '';
    const newOtp = currentValue.split('');
    newOtp[index] = digit;
    const result = newOtp.join('').slice(0, length);
    onChangeText(result);

    // Move to next input if there's a digit
    if (digit && index < length - 1) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      const currentValue = value || '';
      
      // If current box is empty and it's not the first box, move back and clear
      if (!currentValue[index] && index > 0) {
        const newOtp = currentValue.split('');
        newOtp[index - 1] = '';
        onChangeText(newOtp.join(''));
        inputRefs[index - 1]?.current?.focus();
      } else {
        // Clear current box
        const newOtp = currentValue.split('');
        newOtp[index] = '';
        onChangeText(newOtp.join(''));
      }
    }
  };

  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length }).map((_, index) => {
        const currentValue = value || '';
        const digit = currentValue[index] || '';
        const isFilled = digit.length === 1;

        return (
          <View
            key={index}
            className={`
              w-12 h-14 rounded-xl items-center justify-center
              ${isFilled ? 'bg-primary-50 border-primary' : 'bg-white border-gray-200'}
              border
            `}
          >
            <TextInput
              ref={inputRefs[index]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              selectTextOnFocus
              className="text-xl font-semibold text-center"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/components/OtpInput.tsx
git commit -m "feat(auth): add OtpInput component with 6 digit boxes"
```

---

## Task 4: Build GenderSelector Component

**Files:**
- Create: `features/auth/components/GenderSelector.tsx`

- [ ] **Step 1: Create GenderSelector component**

```typescript
// features/auth/components/GenderSelector.tsx
import { View, Text, TouchableOpacity } from 'react-native';

type Gender = 'pria' | 'wanita' | null;

interface GenderSelectorProps {
  value: Gender;
  onChange: (gender: Gender) => void;
}

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <View className="flex-row gap-3">
      <TouchableOpacity
        onPress={() => onChange('pria')}
        className={`
          flex-1 py-3.5 rounded-xl border items-center
          ${value === 'pria' ? 'bg-black border-black' : 'bg-white border-gray-200'}
        `}
        activeOpacity={0.8}
      >
        <Text
          className={`
            text-base font-medium
            ${value === 'pria' ? 'text-white' : 'text-gray-700'}
          `}
        >
          Pria
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange('wanita')}
        className={`
          flex-1 py-3.5 rounded-xl border items-center
          ${value === 'wanita' ? 'bg-black border-black' : 'bg-white border-gray-200'}
        `}
        activeOpacity={0.8}
      >
        <Text
          className={`
            text-base font-medium
            ${value === 'wanita' ? 'text-white' : 'text-gray-700'}
          `}
        >
          Wanita
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/components/GenderSelector.tsx
git commit -m "feat(auth): add GenderSelector component with Pria/Wanita options"
```

---

## Task 5: Build PhoneScreen

**Files:**
- Create: `features/auth/screens/PhoneScreen.tsx`

- [ ] **Step 1: Create PhoneScreen with illustration placeholder**

```typescript
// features/auth/screens/PhoneScreen.tsx
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneInput } from '../components/PhoneInput';

export function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.length < 10) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to OTP screen, pass phone as param
      router.push({ pathname: '/auth/otp', params: { phone } });
    }, 1000);
  };

  const isValidPhone = phone.length >= 10;

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
          {/* Illustration Placeholder */}
          <View 
            className="w-full h-48 rounded-2xl mb-8 items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Text className="text-gray-400 text-sm">Illustration Placeholder</Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Masuk atau Daftar
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Kami akan mengirimkan kode verifikasi ke nomor HP Anda
          </Text>

          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Nomor Handphone
            </Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              onSubmit={handleContinue}
              disabled={isLoading}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValidPhone || isLoading}
            className={`
              rounded-xl py-4 items-center
              ${isValidPhone && !isLoading ? 'bg-black' : 'bg-gray-300'}
            `}
            activeOpacity={0.8}
          >
            <Text
              className={`
                text-base font-semibold
                ${isValidPhone && !isLoading ? 'text-white' : 'text-gray-500'}
              `}
            >
              {isLoading ? 'Mengirim...' : 'Lanjutkan'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/screens/PhoneScreen.tsx
git commit -m "feat(auth): add PhoneScreen with illustration placeholder"
```

---

## Task 6: Build OtpScreen

**Files:**
- Create: `features/auth/screens/OtpScreen.tsx`

- [ ] **Step 1: Create OtpScreen with OTP input and resend functionality**

```typescript
// features/auth/screens/OtpScreen.tsx
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { OtpInput } from '../components/OtpInput';

export function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    // Simulate API verification
    setTimeout(() => {
      setIsLoading(false);
      // For static demo, assume new user - navigate to complete profile
      router.replace('/auth/complete-profile');
    }, 1000);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    // Simulate resend
  };

  // Mask phone number for display
  const maskedPhone = params.phone 
    ? `+62 ${params.phone.slice(0, 3)}****${params.phone.slice(-3)}`
    : '';

  const isComplete = otp.length === 6;

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
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Verifikasi Nomor HP
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Masukkan kode 6 digit yang dikirim ke {maskedPhone}
          </Text>

          {/* OTP Input */}
          <View className="mb-8">
            <OtpInput value={otp} onChangeText={setOtp} disabled={isLoading} />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isComplete || isLoading}
            className={`
              rounded-xl py-4 items-center mb-4
              ${isComplete && !isLoading ? 'bg-black' : 'bg-gray-300'}
            `}
            activeOpacity={0.8}
          >
            <Text
              className={`
                text-base font-semibold
                ${isComplete && !isLoading ? 'text-white' : 'text-gray-500'}
              `}
            >
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </Text>
          </TouchableOpacity>

          {/* Resend Code */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-600">
              Tidak menerima kode?{' '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-sm font-semibold text-primary">
                  Kirim ulang kode
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-sm font-semibold text-gray-400">
                Kirim ulang dalam {countdown}s
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/screens/OtpScreen.tsx
git commit -m "feat(auth): add OtpScreen with countdown timer"
```

---

## Task 7: Build CompleteProfileScreen

**Files:**
- Create: `features/auth/screens/CompleteProfileScreen.tsx`

- [ ] **Step 1: Create CompleteProfileScreen with form fields**

```typescript
// features/auth/screens/CompleteProfileScreen.tsx
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenderSelector } from '../components/GenderSelector';

type Gender = 'pria' | 'wanita' | null;

export function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !gender) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/auth/success');
    }, 1000);
  };

  const isValid = name.trim().length > 0 && email.trim().length > 0 && gender !== null;

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
          {/* Title */}
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">\            Lengkapi Profil
          </Text>
          <Text className="text-base text-gray-600 mb-8">\            Berikan informasi untuk melanjutkan
          </Text>

          {/* Name Input */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">\              Nama Lengkap
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base border border-gray-200"
            />
          </View>

          {/* Email Input */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">\              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Masukkan email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-white rounded-xl px-4 py-4 text-base border border-gray-200"
            />
          </View>

          {/* Gender Selector */}
          <View className="mb-8">
            <Text className="text-sm text-gray-600 mb-2 font-medium">\              Jenis Kelamin
            </Text>
            <GenderSelector value={gender} onChange={setGender} />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className={`
              rounded-xl py-4 items-center
              ${isValid && !isLoading ? 'bg-black' : 'bg-gray-300'}
            `}
            activeOpacity={0.8}
          >
            <Text
              className={`
                text-base font-semibold
                ${isValid && !isLoading ? 'text-white' : 'text-gray-500'}
              `}
            >
              {isLoading ? 'Menyimpan...' : 'Selesai'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/screens/CompleteProfileScreen.tsx
git commit -m "feat(auth): add CompleteProfileScreen with name, email, gender"
```

---

## Task 8: Build SuccessScreen

**Files:**
- Create: `features/auth/screens/SuccessScreen.tsx`

- [ ] **Step 1: Create SuccessScreen with welcome message**

```typescript
// features/auth/screens/SuccessScreen.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from '@solar-icons/react-native/Linear';

export function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    // Navigate to main tabs and reset the navigation stack
    router.replace('/(tabs)');
  };

  return (
    <View 
      className="flex-1 bg-background items-center justify-center"
      style={{ paddingHorizontal: 20, paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
    >
      {/* Success Icon */}
      <View className="mb-6">
        <CheckCircle size={80} className="text-green-500" />
      </View>

      {/* Title */}
      <Text className="text-2xl font-heading font-medium text-gray-900 mb-3 text-center">\        Selamat Datang!\Text>

      {/* Subtitle */}
      <Text className="text-base text-gray-600 text-center mb-10">\        Akun Anda berhasil dibuat. Mulai jelajahi produk menarik atau jual barang Anda sekarang.
      </Text>

      {/* Start Button */}
      <TouchableOpacity
        onPress={handleStart}
        className="bg-black rounded-xl py-4 items-center w-full"
        activeOpacity={0.8}
      >
        <Text className="text-base font-semibold text-white">
          Mulai Jelajahi
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/auth/screens/SuccessScreen.tsx
git commit -m "feat(auth): add SuccessScreen with welcome message"
```

---

## Task 9: Create Auth Layout and Route Files

**Files:**
- Create: `app/auth/_layout.tsx`
- Create: `app/auth/index.tsx`
- Create: `app/auth/otp.tsx`
- Create: `app/auth/complete-profile.tsx`
- Create: `app/auth/success.tsx`

- [ ] **Step 1: Create auth layout with Stack navigator**

```typescript
// app/auth/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create route files that render screens**

```typescript
// app/auth/index.tsx
import { PhoneScreen } from '@/features/auth';

export default function AuthIndex() {
  return <PhoneScreen />;
}
```

```typescript
// app/auth/otp.tsx
import { OtpScreen } from '@/features/auth';

export default function OtpRoute() {
  return <OtpScreen />;
}
```

```typescript
// app/auth/complete-profile.tsx
import { CompleteProfileScreen } from '@/features/auth';

export default function CompleteProfileRoute() {
  return <CompleteProfileScreen />;
}
```

```typescript
// app/auth/success.tsx
import { SuccessScreen } from '@/features/auth';

export default function SuccessRoute() {
  return <SuccessScreen />;
}
```

- [ ] **Step 3: Update root layout to include auth routes**

Modify `app/_layout.tsx` to add the auth stack:

```typescript
// app/_layout.tsx - add after existing Stack.Screen entries:
          <Stack.Screen 
            name="auth" 
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }} 
          />
```

- [ ] **Step 4: Commit**

```bash
git add app/auth/ app/_layout.tsx
git commit -m "feat(auth): add auth routes and navigation layout"
```

---

## Task 10: Test Auth Flow

**Files:**
- None (testing only)

- [ ] **Step 1: Run the app and verify auth flow**

```bash
npm start
```

Test the complete flow:
1. Navigate to `/auth` - Phone screen should show
2. Enter phone number (min 10 digits) - Continue button should enable
3. Tap Continue - OTP screen should show
4. Enter 6 digits - Verify button should enable
5. Tap Verify - Complete Profile screen should show
6. Fill all fields and select gender - Selesai button should enable
7. Tap Selesai - Success screen should show
8. Tap Mulai Jelajahi - Should navigate to home tabs

---

## Summary

This implementation creates a complete static auth flow with:
- Phone number input with +62 prefix
- 6-digit OTP verification with resend countdown
- Profile completion form (name, email, gender)
- Welcome success screen
- Proper navigation flow using Expo Router Stack

Total: 9 components/screens + 5 route files
All static with mock delays - ready for backend integration later.