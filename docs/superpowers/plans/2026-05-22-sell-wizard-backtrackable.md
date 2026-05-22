# Sell Wizard Backtrackable Refactor - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the sell wizard to use URL-based routing with one route per step, enabling native back button navigation.

**Architecture:** Create a `SellFormContext` to hold form state, wrapped by a new `_layout.tsx` in the sell routes. Each step becomes its own route file that renders the existing step components. Step state is derived from the current route path.

**Tech Stack:** React Native, Expo Router, React Context, TypeScript

---

## Task 1: Create SellFormContext

**Files:**
- Create: `apps/mobile/features/sell/context/SellFormContext.tsx`

- [ ] **Step 1: Create the SellFormContext with form state management**

```typescript
// features/sell/context/SellFormContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { SellFormData, ProductCategory, ProductCondition } from '../types';

const initialFormData: SellFormData = {
  photos: [],
  category: '',
  condition: '',
  name: '',
  price: 0,
  description: '',
};

interface SellFormContextValue {
  formData: SellFormData;
  updateFormData: (updates: Partial<SellFormData>) => void;
  resetForm: () => void;
  hasData: boolean;
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
  publishedProductId: string | null;
  setPublishedProductId: (id: string | null) => void;
}

const SellFormContext = createContext<SellFormContextValue | undefined>(undefined);

export function SellFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<SellFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<SellFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setIsSubmitting(false);
    setPublishedProductId(null);
  }, []);

  // Check if form has any user-entered data
  const hasData = useMemo(() => {
    return (
      formData.photos.length > 0 ||
      formData.category !== '' ||
      formData.condition !== '' ||
      formData.name !== '' ||
      formData.price > 0 ||
      formData.description !== ''
    );
  }, [formData]);

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  return (
    <SellFormContext.Provider
      value={{
        formData,
        updateFormData,
        resetForm,
        hasData,
        isSubmitting,
        setSubmitting,
        publishedProductId,
        setPublishedProductId,
      }}
    >
      {children}
    </SellFormContext.Provider>
  );
}

export function useSellFormContext() {
  const context = useContext(SellFormContext);
  if (!context) {
    throw new Error('useSellFormContext must be used within a SellFormProvider');
  }
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/sell/context/SellFormContext.tsx
git commit -m "feat(sell): add SellFormContext for form state management"
```

---

## Task 2: Create sell routes layout

**Files:**
- Create: `apps/mobile/app/(protected)/sell/_layout.tsx`

- [ ] **Step 1: Create the layout with SellFormProvider and shared UI**

```typescript
// app/(protected)/sell/_layout.tsx
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle } from '@solar-icons/react-native/Linear';
import { SellFormProvider, useSellFormContext } from '@/features/sell/context/SellFormContext';
import { StepIndicator } from '@/features/sell/components/StepIndicator';
import type { WizardStep } from '@/features/sell/types';

const routeToStep: Record<string, WizardStep> = {
  foto: 1,
  kategori: 2,
  info: 3,
  review: 4,
};

function SellLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { hasData, resetForm } = useSellFormContext();

  // Derive current step from route
  const currentRoute = pathname.split('/').pop() || 'foto';
  const currentStep = routeToStep[currentRoute] ?? 1;

  // Handle hardware back button on first step
  useEffect(() => {
    const backAction = () => {
      if (currentStep === 1) {
        if (hasData) {
          Alert.alert(
            'Batalkan?',
            'Yakin ingin membatalkan? Data yang sudah diisi akan hilang.',
            [
              { text: 'Tidak', style: 'cancel' },
              {
                text: 'Ya, batalkan',
                style: 'destructive',
                onPress: () => {
                  resetForm();
                  router.replace('/(tabs)');
                },
              },
            ]
          );
          return true; // Prevent default back behavior
        }
        // Let default back behavior close the wizard
        return false;
      }
      // For other steps, let default back behavior navigate
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [currentStep, hasData, resetForm, router]);

  const handleClose = () => {
    if (hasData) {
      Alert.alert(
        'Batalkan?',
        'Yakin ingin membatalkan? Data yang sudah diisi akan hilang.',
        [
          { text: 'Tidak', style: 'cancel' },
          {
            text: 'Ya, batalkan',
            style: 'destructive',
            onPress: () => {
              resetForm();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header with Step Indicator and Close Button */}
      <View className="relative">
        <StepIndicator
          currentStep={currentStep}
          stepLabels={['Foto', 'Kategori', 'Info', 'Review']}
        />

        {/* Close Button */}
        <TouchableOpacity
          onPress={handleClose}
          className="absolute right-4 top-3 z-10"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseCircle size={28} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Step Content */}
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="foto" />
        <Stack.Screen name="kategori" />
        <Stack.Screen name="info" />
        <Stack.Screen name="review" />
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      </Stack>
    </View>
  );
}

export default function SellLayout() {
  return (
    <SellFormProvider>
      <SellLayoutContent />
    </SellFormProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(protected\)/sell/_layout.tsx
git commit -m "feat(sell): add sell routes layout with SellFormProvider"
```

---

## Task 3: Create step route files

**Files:**
- Create: `apps/mobile/app/(protected)/sell/foto.tsx`
- Create: `apps/mobile/app/(protected)/sell/kategori.tsx`
- Create: `apps/mobile/app/(protected)/sell/info.tsx`
- Create: `apps/mobile/app/(protected)/sell/review.tsx`
- Create: `apps/mobile/app/(protected)/sell/success.tsx`

- [ ] **Step 1: Create foto.tsx (Step 1)**

```typescript
// app/(protected)/sell/foto.tsx
import { useRouter } from 'expo-router';
import { PhotoUploadStep } from '@/features/sell/components/PhotoUploadStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

const DEV_MODE = true;

export default function FotoStep() {
  const router = useRouter();
  const { formData, updateFormData } = useSellFormContext();

  const handleNext = () => {
    router.push('/sell/kategori');
  };

  return (
    <PhotoUploadStep
      photos={formData.photos}
      onPhotosChange={(photos) => updateFormData({ photos })}
      onNext={handleNext}
      isDevMode={DEV_MODE}
    />
  );
}
```

- [ ] **Step 2: Create kategori.tsx (Step 2)**

```typescript
// app/(protected)/sell/kategori.tsx
import { useRouter } from 'expo-router';
import { CategoryStep } from '@/features/sell/components/CategoryStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

export default function KategoriStep() {
  const router = useRouter();
  const { formData, updateFormData } = useSellFormContext();

  const handleNext = () => {
    router.push('/sell/info');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <CategoryStep
      selectedCategory={formData.category}
      onCategorySelect={(category) => updateFormData({ category })}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
```

- [ ] **Step 3: Create info.tsx (Step 3)**

```typescript
// app/(protected)/sell/info.tsx
import { useRouter } from 'expo-router';
import { ProductInfoStep } from '@/features/sell/components/ProductInfoStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

const DEV_MODE = true;

export default function InfoStep() {
  const router = useRouter();
  const { formData, updateFormData } = useSellFormContext();

  const handleNext = () => {
    router.push('/sell/review');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ProductInfoStep
      formData={formData}
      onFormChange={updateFormData}
      onNext={handleNext}
      onBack={handleBack}
      isDevMode={DEV_MODE}
    />
  );
}
```

- [ ] **Step 4: Create review.tsx (Step 4)**

```typescript
// app/(protected)/sell/review.tsx
import { useRouter } from 'expo-router';
import { ReviewStep } from '@/features/sell/components/ReviewStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

// Mock publish function - will be replaced with actual API call
import type { SellFormData } from '@/features/sell/types';

async function publishProduct(formData: SellFormData): Promise<string> {
  console.log('Publishing product:', formData);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return 'prod_' + Date.now().toString(36);
}

export default function ReviewStep() {
  const router = useRouter();
  const { formData, isSubmitting, setSubmitting, setPublishedProductId } = useSellFormContext();

  const handleEditPhotos = () => {
    router.push('/sell/foto');
  };

  const handleEditInfo = () => {
    router.push('/sell/info');
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const productId = await publishProduct(formData);
      setPublishedProductId(productId);
      router.replace('/sell/success');
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ReviewStep
      formData={formData}
      isSubmitting={isSubmitting}
      onEditPhotos={handleEditPhotos}
      onEditInfo={handleEditInfo}
      onPublish={handlePublish}
      onBack={handleBack}
    />
  );
}
```

- [ ] **Step 5: Create success.tsx (Post-publish screen)**

```typescript
// app/(protected)/sell/success.tsx
import { useRouter } from 'expo-router';
import { SuccessScreen } from '@/features/sell/components/SuccessScreen';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

export default function SuccessStep() {
  const router = useRouter();
  const { publishedProductId, resetForm } = useSellFormContext();

  if (!publishedProductId) {
    // Should not happen, but safety check
    router.replace('/sell/foto');
    return null;
  }

  const handleViewProduct = () => {
    router.push(`/product/${publishedProductId}`);
  };

  const handleBackToHome = () => {
    resetForm();
    router.replace('/(tabs)');
  };

  return (
    <SuccessScreen
      productId={publishedProductId}
      onViewProduct={handleViewProduct}
      onBackToHome={handleBackToHome}
    />
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/\(protected\)/sell/foto.tsx apps/mobile/app/\(protected\)/sell/kategori.tsx apps/mobile/app/\(protected\)/sell/info.tsx apps/mobile/app/\(protected\)/sell/review.tsx apps/mobile/app/\(protected\)/sell/success.tsx
git commit -m "feat(sell): add step route files for foto, kategori, info, review, success"
```

---

## Task 4: Update protected layout

**Files:**
- Modify: `apps/mobile/app/(protected)/_layout.tsx`

- [ ] **Step 1: Replace sell/index with sell/foto in Stack.Screen**

Current line:
```typescript
<Stack.Screen name="sell/index" />
```

Change to:
```typescript
<Stack.Screen name="sell" />
```

The full file should become:

```typescript
// app/(protected)/_layout.tsx
import { Stack, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check in development mode
    if (__DEV__) return;
    
    if (!isAuthenticated) {
      router.replace(`/auth?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, pathname, router]);

  // Skip auth check in development mode
  if (__DEV__) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sell" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/profil" />
        <Stack.Screen name="settings/handphone" />
        <Stack.Screen name="settings/keamanan" />
        <Stack.Screen name="settings/notifikasi" />
      </Stack>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(protected\)/_layout.tsx
git commit -m "feat(sell): update protected layout to use nested sell routes"
```

---

## Task 5: Update tabs layout for Jual button

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update Jual tab button navigation path**

Find the line:
```typescript
onPress={() => handleProtectedNavigation("/(protected)/sell")}
```

Change to:
```typescript
onPress={() => handleProtectedNavigation("/(protected)/sell/foto")}
```

The relevant section should be:

```typescript
<Tabs.Screen
  name="jual"
  options={{
    title: "Jual",
    tabBarButton: () => (
      <TouchableOpacity
        onPress={() => handleProtectedNavigation("/(protected)/sell/foto")}
        className="items-center -mt-6"
        activeOpacity={0.8}
      >
        <View
          className="w-14 h-14 bg-primary rounded-full items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <AddSquare color="#FFFFFF" size={28} strokeWidth={2.5} />
        </View>
        <Text className="text-[12px] font-medium text-black mt-1">
          Jual
        </Text>
      </TouchableOpacity>
    ),
  }}
/>
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat(sell): update Jual button to navigate to foto step"
```

---

## Task 6: Clean up obsolete files

**Files:**
- Delete: `apps/mobile/features/sell/components/SellWizard.tsx`
- Delete: `apps/mobile/features/sell/SellScreen.tsx`
- Delete: `apps/mobile/app/(protected)/sell/index.tsx`

- [ ] **Step 1: Delete obsolete files**

```bash
rm apps/mobile/features/sell/components/SellWizard.tsx
rm apps/mobile/features/sell/SellScreen.tsx
rm apps/mobile/app/\(protected\)/sell/index.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "refactor(sell): remove obsolete SellWizard and SellScreen files"
```

---

## Task 7: Verification

**Files:**
- None (testing only)

- [ ] **Step 1: Verify the app starts without errors**

Run: `npx expo start` (in apps/mobile directory)

Expected: App starts, no runtime errors

- [ ] **Step 2: Verify navigation flow**

Test steps:
1. Tap Jual button → should navigate to /sell/foto
2. Add a photo, tap Lanjut → should navigate to /sell/kategori
3. Select category, tap Lanjut → should navigate to /sell/info
4. Fill info, tap Lanjut → should navigate to /sell/review
5. Tap hardware back button → should navigate to /sell/info
6. Tap back again → should navigate to /sell/kategori
7. Tap back again → should navigate to /sell/foto
8. Tap back again → should show confirmation dialog if data exists

Expected: All navigation works as expected, back button navigates step-by-step

- [ ] **Step 3: Verify close button behavior**

Test steps:
1. Start wizard, add a photo
2. Tap X button → should show confirmation dialog
3. Tap "Tidak" → should stay on step
4. Tap X button again
5. Tap "Ya, batalkan" → should navigate to home and clear form

Expected: Close button shows confirmation when form has data

- [ ] **Step 4: Verify success screen blocks back**

Test steps:
1. Complete the wizard and publish
2. On success screen, tap hardware back button
3. Should stay on success screen (back is blocked)

Expected: Success screen blocks back navigation

- [ ] **Step 5: Commit verification**

```bash
git add -A
git commit -m "chore: verify sell wizard backtrackable implementation"
```

---

## Summary

This plan refactors the sell wizard from a single-route, state-managed wizard to a multi-route, URL-based wizard with:

1. **SellFormContext** - Holds all form state in one place
2. **Nested routes** - Each step is its own route under `/sell/`
3. **Native back support** - Hardware back navigates between steps
4. **Confirmation dialog** - Close button warns before discarding data
5. **Edit navigation** - Review step edits push onto stack (backable)
6. **Success blocking** - Post-publish screen blocks back navigation

All existing step components remain unchanged - only their prop sources change from wizard-level state to context.