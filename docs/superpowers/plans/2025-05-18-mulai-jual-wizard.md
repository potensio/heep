# Mulai Jual - Step-by-Step Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 3-step wizard untuk user mulai berjualan produk fisik dengan upload foto, input info dasar, dan review sebelum publish.

**Architecture:** Single wizard container dengan step-based rendering, form state pakai React useState, navigation pakai Expo Router dengan conditional rendering steps. Setiap step adalah component independen yang menerima props callback.

**Tech Stack:** Expo SDK 54, React Native, NativeWind, expo-image-picker, @solar-icons/react-native, Expo Router

**Reference Spec:** `docs/superpowers/specs/2025-05-18-mulai-jual-wizard-design.md`

---

## File Structure

```
features/sell/
├── SellScreen.tsx              # Main entry wizard container
├── components/
│   ├── SellWizard.tsx          # Wizard state management & navigation
│   ├── StepIndicator.tsx       # Progress bar 1/2/3
│   ├── PhotoUploadStep.tsx     # Step 1: Upload foto
│   ├── ProductInfoStep.tsx     # Step 2: Form nama, harga, deskripsi
│   ├── ReviewStep.tsx          # Step 3: Preview & publish
│   ├── SuccessScreen.tsx       # Post-publish screen
│   ├── PhotoGrid.tsx           # Reusable photo grid UI
│   └── PriceInput.tsx          # Rupiah formatted input
├── hooks/
│   └── useSellForm.ts          # Form state hook
└── types.ts                    # TypeScript interfaces
```

---

## Task 1: Create Types Definition

**Files:**
- Create: `features/sell/types.ts`

- [ ] **Step 1: Write type definitions**

```typescript
// features/sell/types.ts

export interface SellFormData {
  photos: string[];
  name: string;
  price: number;
  description: string;
}

export type WizardStep = 1 | 2 | 3;

export interface SellWizardState {
  currentStep: WizardStep;
  formData: SellFormData;
  isSubmitting: boolean;
  error: string | null;
}

export interface PhotoUploadStepProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
}

export interface ProductInfoStepProps {
  formData: SellFormData;
  onFormChange: (data: Partial<SellFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ReviewStepProps {
  formData: SellFormData;
  isSubmitting: boolean;
  onEditPhotos: () => void;
  onEditInfo: () => void;
  onPublish: () => void;
  onBack: () => void;
}

export interface SuccessScreenProps {
  productId: string;
  onViewProduct: () => void;
  onSellAgain: () => void;
}
```

- [ ] **Step 2: Commit**

```bash
git add features/sell/types.ts
git commit -m "feat(sell): add TypeScript types for sell wizard"
```

---

## Task 2: Create useSellForm Hook

**Files:**
- Create: `features/sell/hooks/useSellForm.ts`

- [ ] **Step 1: Create hooks directory dan write the hook**

```bash
mkdir -p features/sell/hooks
```

```typescript
// features/sell/hooks/useSellForm.ts
import { useState, useCallback } from 'react';
import type { SellFormData, WizardStep } from '../types';

const initialFormData: SellFormData = {
  photos: [],
  name: '',
  price: 0,
  description: '',
};

export function useSellForm() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<SellFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<SellFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => (prev < 3 ? (prev + 1) as WizardStep : prev));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => (prev > 1 ? (prev - 1) as WizardStep : prev));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setError(null);
  }, []);

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  const setErrorMessage = useCallback((message: string | null) => {
    setError(message);
  }, []);

  return {
    currentStep,
    formData,
    isSubmitting,
    error,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    resetForm,
    setSubmitting,
    setErrorMessage,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/sell/hooks/useSellForm.ts
git commit -m "feat(sell): add useSellForm hook for form state management"
```

---

## Task 3: Install expo-image-picker

**Files:**
- Modify: `package.json`
- Modify: `app.json`

- [ ] **Step 1: Install dependency**

```bash
npx expo install expo-image-picker
```

Expected output shows package installed successfully.

- [ ] **Step 2: Update app.json dengan permissions**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Aplikasi memerlukan akses galeri untuk upload foto produk"
        }
      ]
    ]
  }
}
```

Merge ke existing app.json config yang sudah ada.

- [ ] **Step 3: Commit**

```bash
git add package.json app.json package-lock.json
git commit -m "chore: install expo-image-picker for photo upload"
```

---

## Task 4: Create StepIndicator Component

**Files:**
- Create: `features/sell/components/StepIndicator.tsx`

- [ ] **Step 1: Create components directory dan write component**

```bash
mkdir -p features/sell/components
```

```typescript
// features/sell/components/StepIndicator.tsx
import { View, Text } from 'react-native';
import type { WizardStep } from '../types';

interface StepIndicatorProps {
  currentStep: WizardStep;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, stepLabels }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center px-4 py-3">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isLast = index === stepLabels.length - 1;

        return (
          <View key={stepNumber} className="flex-row items-center">
            <View className="items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isActive
                    ? 'bg-[#9AE600]'
                    : isCompleted
                    ? 'bg-[#9AE600]'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive || isCompleted ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {stepNumber}
                </Text>
              </View>
              <Text
                className={`text-xs mt-1 ${
                  isActive ? 'text-[#7CCF00] font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </Text>
            </View>

            {!isLast && (
              <View
                className={`w-12 h-0.5 mx-2 ${
                  isCompleted ? 'bg-[#9AE600]' : 'bg-gray-200'
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/sell/components/StepIndicator.tsx
git commit -m "feat(sell): add StepIndicator component for wizard progress"
```

---

## Task 5: Create PriceInput Component

**Files:**
- Create: `features/sell/components/PriceInput.tsx`

- [ ] **Step 1: Write the component**

```typescript
// features/sell/components/PriceInput.tsx
import { View, TextInput, Text } from 'react-native';
import { useState, useEffect } from 'react';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
}

function formatRupiah(value: number): string {
  if (!value || value === 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(value: string): number {
  const numeric = value.replace(/[^\d]/g, '');
  return parseInt(numeric, 10) || 0;
}

export function PriceInput({ value, onChange, placeholder = '0', error }: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(formatRupiah(value));

  useEffect(() => {
    setDisplayValue(formatRupiah(value));
  }, [value]);

  const handleChange = (text: string) => {
    const numeric = text.replace(/[^\d]/g, '');
    const numberValue = parseInt(numeric, 10) || 0;
    setDisplayValue(formatRupiah(numberValue));
    onChange(numberValue);
  };

  return (
    <View>
      <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-white">
        <Text className="text-gray-700 font-medium mr-2">Rp</Text>
        <TextInput
          className="flex-1 text-gray-900 text-base"
          value={displayValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          keyboardType="number-pad"
          maxLength={15}
        />
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/sell/components/PriceInput.tsx
git commit -m "feat(sell): add PriceInput component with rupiah formatting"
```

---

## Task 6: Create PhotoGrid Component

**Files:**
- Create: `features/sell/components/PhotoGrid.tsx`

- [ ] **Step 1: Write the component**

```typescript
// features/sell/components/PhotoGrid.tsx
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { GalleryAdd, Trash } from '@solar-icons/react-native/Linear';

interface PhotoGridProps {
  photos: string[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  maxPhotos?: number;
}

export function PhotoGrid({ photos, onAddPhoto, onRemovePhoto, maxPhotos = 6 }: PhotoGridProps) {
  const slots = Array.from({ length: maxPhotos }, (_, i) => i);

  return (
    <View className="flex-row flex-wrap gap-3">
      {slots.map((index) => {
        const photo = photos[index];
        const isEmpty = !photo;

        if (isEmpty) {
          const isFirstEmpty = index === photos.length;
          if (!isFirstEmpty && index > photos.length) return null;

          return (
            <TouchableOpacity
              key={`empty-${index}`}
              onPress={onAddPhoto}
              className="w-[31%] aspect-square rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 active:bg-gray-100"
            >
              <GalleryAdd size={32} className="text-gray-400" />
              {photos.length === 0 && index === 0 && (
                <Text className="text-xs text-gray-400 mt-2 text-center px-2">
                  Tap untuk tambah foto
                </Text>
              )}
            </TouchableOpacity>
          );
        }

        return (
          <View key={`photo-${index}`} className="w-[31%] aspect-square rounded-xl overflow-hidden relative">
            <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity
              onPress={() => onRemovePhoto(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
            >
              <Trash size={14} className="text-white" />
            </TouchableOpacity>
            {index === 0 && (
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 py-1">
                <Text className="text-white text-xs text-center">Cover</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/sell/components/PhotoGrid.tsx
git commit -m "feat(sell): add PhotoGrid component for photo upload UI"
```

---

## Task 7: Create PhotoUploadStep Component

**Files:**
- Create: `features/sell/components/PhotoUploadStep.tsx`

- [ ] **Step 1: Write the component**

```typescript
// features/sell/components/PhotoUploadStep.tsx
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoGrid } from './PhotoGrid';
import type { PhotoUploadStepProps } from '../types';

export function PhotoUploadStep({ photos, onPhotosChange, onNext }: PhotoUploadStepProps) {
  const handleAddPhoto = async () => {
    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Maksimal Foto', 'Kamu hanya bisa upload maksimal 6 foto');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Kamu perlu memberikan izin akses galeri');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      onPhotosChange([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canProceed = photos.length >= 1;

  return (
    <View className="flex-1 px-5 pt-4">
      <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
        Upload Foto Produk
      </Text>
      <Text className="text-gray-500 mb-