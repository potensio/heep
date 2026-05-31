# Category Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single shared TypeScript package as the source of truth for all categories, subcategories, and attribute schemas — consumed by mobile, backend, and future web.

**Architecture:** `packages/categories/index.ts` holds all category definitions. Mobile and backend reference it via tsconfig path aliases (`@bantujual/categories`). Mobile Metro config gets `watchFolders` to resolve the out-of-project-root path. Backend DB schema derives its enums directly from the shared package.

**Tech Stack:** TypeScript, Expo/React Native, Drizzle ORM (PostgreSQL), Vitest (backend tests), NativeWind v4

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `packages/categories/index.ts` | Shared source of truth: types + CATEGORIES data |
| Modify | `apps/mobile/tsconfig.json` | Add `@bantujual/categories` path alias |
| Modify | `apps/mobile/metro.config.js` | Add `watchFolders` for packages dir |
| Modify | `apps/backend/tsconfig.json` | Add `@bantujual/categories` path alias |
| Modify | `apps/backend/src/core/db/schema.ts` | Derive enums from shared package, add `subcategory` + `attributes` columns |
| Modify | `apps/mobile/lib/types.ts` | Remove `ProductCategory`, `CATEGORY_OPTIONS`, `ProductCondition`, `CONDITION_OPTIONS` |
| Modify | `apps/mobile/features/sell/types.ts` | Update `SellFormData`: add `subcategory` + `attributes`, remove `condition` |
| Modify | `apps/mobile/features/sell/context/SellFormContext.tsx` | Update initial state + `hasData` |
| Modify | `apps/mobile/features/sell/hooks/useSellForm.ts` | Update initial state |
| Modify | `apps/mobile/features/sell/components/CategoryStep.tsx` | Use `CATEGORIES` from shared package, simplify iconMap to 3 icons |
| Modify | `apps/mobile/features/sell/components/ProductInfoStep.tsx` | Remove condition, add subcategory chips + dynamic attribute fields |
| Modify | `apps/mobile/features/sell/components/ReviewStep.tsx` | Show subcategory + attributes, use shared package for labels |

---

## Task 1: Create shared categories package

**Files:**
- Create: `packages/categories/index.ts`

- [ ] **Step 1: Create the file**

```ts
// packages/categories/index.ts

export interface CategoryAttribute {
  id: string
  label: string
  type: 'select' | 'number' | 'text'
  options?: string[]
  required: boolean
}

export interface SubcategoryDefinition {
  id: string
  label: string
  attributes: CategoryAttribute[]
}

export interface CategoryDefinition {
  id: string
  label: string
  icon: string
  subcategories: SubcategoryDefinition[]
  sharedAttributes: CategoryAttribute[]
}

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: 'kendaraan',
    label: 'Kendaraan',
    icon: 'Car',
    subcategories: [
      { id: 'mobil', label: 'Mobil', attributes: [] },
      { id: 'motor', label: 'Motor', attributes: [] },
    ],
    sharedAttributes: [
      {
        id: 'condition',
        label: 'Kondisi',
        type: 'select',
        options: ['Baru', 'Bekas'],
        required: true,
      },
      {
        id: 'year',
        label: 'Tahun',
        type: 'number',
        required: true,
      },
      {
        id: 'mileage',
        label: 'Kilometer',
        type: 'number',
        required: true,
      },
      {
        id: 'brand',
        label: 'Merk',
        type: 'select',
        options: [
          'Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi',
          'Nissan', 'Mazda', 'BMW', 'Mercedes-Benz',
          'Yamaha', 'Kawasaki', 'Vespa', 'Lainnya',
        ],
        required: true,
      },
      {
        id: 'model',
        label: 'Tipe',
        type: 'text',
        required: false,
      },
      {
        id: 'fuel',
        label: 'Bahan Bakar',
        type: 'select',
        options: ['Bensin', 'Solar', 'Listrik', 'Hybrid'],
        required: true,
      },
    ],
  },
  {
    id: 'properti',
    label: 'Properti',
    icon: 'Buildings',
    subcategories: [
      {
        id: 'rumah',
        label: 'Rumah',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: true },
        ],
      },
      {
        id: 'tanah',
        label: 'Tanah',
        attributes: [],
      },
      {
        id: 'apartemen',
        label: 'Apartemen',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: false },
        ],
      },
      {
        id: 'kantor',
        label: 'Kantor',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: false },
        ],
      },
      {
        id: 'ruko',
        label: 'Ruko',
        attributes: [
          { id: 'building_area', label: 'Luas Bangunan (m²)', type: 'number', required: true },
          { id: 'floors', label: 'Jumlah Lantai', type: 'number', required: true },
        ],
      },
    ],
    sharedAttributes: [
      {
        id: 'listing_type',
        label: 'Status',
        type: 'select',
        options: ['Jual', 'Sewa'],
        required: true,
      },
      {
        id: 'certificate',
        label: 'Sertifikat',
        type: 'select',
        options: ['SHM', 'SHGB', 'HGB', 'Girik', 'Strata Title', 'Lainnya'],
        required: true,
      },
      {
        id: 'land_area',
        label: 'Luas Lahan (m²)',
        type: 'number',
        required: true,
      },
    ],
  },
  {
    id: 'handphone-tablet',
    label: 'Handphone & Tablet',
    icon: 'Smartphone',
    subcategories: [
      { id: 'handphone', label: 'Handphone', attributes: [] },
      { id: 'tablet', label: 'Tablet', attributes: [] },
      { id: 'aksesoris-gadget', label: 'Aksesoris Gadget', attributes: [] },
    ],
    sharedAttributes: [
      {
        id: 'condition',
        label: 'Kondisi',
        type: 'select',
        options: ['Baru', 'Bekas'],
        required: true,
      },
      {
        id: 'brand',
        label: 'Merk',
        type: 'text',
        required: true,
      },
    ],
  },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
export type SubcategoryId = (typeof CATEGORIES)[number]['subcategories'][number]['id']
```

- [ ] **Step 2: Commit**

```bash
git add packages/categories/index.ts
git commit -m "feat: add shared categories package with types and definitions"
```

---

## Task 2: Configure tsconfig paths and Metro watchFolders

**Files:**
- Modify: `apps/mobile/tsconfig.json`
- Modify: `apps/mobile/metro.config.js`
- Modify: `apps/backend/tsconfig.json`

- [ ] **Step 1: Update `apps/mobile/tsconfig.json`**

The existing `paths` has `"@/*": ["./*"]`. Add the new alias alongside it:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@bantujual/categories": ["../../packages/categories/index.ts"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

- [ ] **Step 2: Update `apps/mobile/metro.config.js`**

Current file uses NativeWind's `withNativeWind`. Preserve that, add `watchFolders`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, "../../packages")];

module.exports = withNativeWind(config, {
  input: "./global.css",
});
```

- [ ] **Step 3: Update `apps/backend/tsconfig.json`**

Add `paths` to the existing compilerOptions:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,
    "paths": {
      "@bantujual/categories": ["../../packages/categories/index.ts"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Verify mobile type-check still passes**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: exits 0 (errors about `CATEGORY_OPTIONS` imports are expected at this stage — they will be resolved in later tasks)

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/tsconfig.json apps/mobile/metro.config.js apps/backend/tsconfig.json
git commit -m "feat: configure @bantujual/categories path alias in mobile, backend, and metro"
```

---

## Task 3: Update backend DB schema

**Files:**
- Modify: `apps/backend/src/core/db/schema.ts`

- [ ] **Step 1: Rewrite `apps/backend/src/core/db/schema.ts`**

Replace the entire file. Key changes: import CATEGORIES, derive both enums from it, add `subcategory` + `attributes` columns to `products`:

```ts
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, jsonb, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { CATEGORIES } from '@bantujual/categories';

export const genderEnum = pgEnum('gender', ['male', 'female']);

const categoryIds = CATEGORIES.map(c => c.id) as [string, ...string[]];
export const productCategoryEnum = pgEnum('product_category', categoryIds);

const subcategoryIds = CATEGORIES.flatMap(c => c.subcategories.map(s => s.id)) as [string, ...string[]];
export const productSubcategoryEnum = pgEnum('product_subcategory', subcategoryIds);

export const productConditionEnum = pgEnum('product_condition', [
  'Baru', 'Masih Bagus', 'Masih Layak', 'Apa adanya',
]);

export const productStatusEnum = pgEnum('product_status', ['active', 'sold', 'draft']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  gender: genderEnum('gender'),
  profileCompleted: boolean('profile_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('otp_codes_email_idx').on(t.email)]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('refresh_tokens_user_id_idx').on(t.userId)]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description').notNull().default(''),
  category: productCategoryEnum('category').notNull(),
  subcategory: productSubcategoryEnum('subcategory').notNull(),
  attributes: jsonb('attributes').notNull().default({}),
  status: productStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('products_seller_id_idx').on(t.sellerId),
  index('products_category_idx').on(t.category),
  index('products_subcategory_idx').on(t.subcategory),
  index('products_attributes_idx').using('gin', t.attributes),
]);

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
}, (t) => [index('product_images_product_id_idx').on(t.productId)]);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  imageUrl: text('image_url'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('messages_conversation_id_idx').on(t.conversationId)]);

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, { fields: [products.sellerId], references: [users.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  product: one(products, { fields: [conversations.productId], references: [products.id] }),
  buyer: one(users, { fields: [conversations.buyerId], references: [users.id] }),
  seller: one(users, { fields: [conversations.sellerId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));
```

- [ ] **Step 2: Generate migration**

```bash
cd apps/backend && npm run db:generate
```

Expected: creates a new file in `drizzle/` directory with the schema changes

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/core/db/schema.ts drizzle/
git commit -m "feat: update backend schema — derive category enums from shared package, add subcategory and attributes columns"
```

---

## Task 4: Update mobile types and SellFormData

**Files:**
- Modify: `apps/mobile/lib/types.ts`
- Modify: `apps/mobile/features/sell/types.ts`
- Modify: `apps/mobile/features/sell/hooks/useSellForm.ts`

- [ ] **Step 1: Update `apps/mobile/lib/types.ts`**

Remove `ProductCategory`, `CategoryOption`, `CATEGORY_OPTIONS`, `ProductCondition`, `CONDITION_OPTIONS`. Keep `Location`, `User`, `Product`, `Message`, `Conversation`, `Order`:

```ts
export interface Location {
  name: string;
  placeId: string;
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

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

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  otherUser: User;
  product: Product;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface Order {
  orderNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  productImage?: string;
}
```

- [ ] **Step 2: Update `apps/mobile/features/sell/types.ts`**

Remove `condition` from `SellFormData`, add `subcategory` and `attributes`. Import `CategoryId` and `SubcategoryId` from shared package:

```ts
import type { CategoryId, SubcategoryId } from '@bantujual/categories';
import type { Location } from '@/lib/types';

export interface SellFormData {
  photos: string[];
  category: CategoryId | '';
  subcategory: SubcategoryId | '';
  attributes: Record<string, string | number>;
  name: string;
  price: number;
  description: string;
  location: Location | null;
}

export type WizardStep = 1 | 2 | 3 | 4;

export interface SellWizardState {
  currentStep: WizardStep;
  formData: SellFormData;
  isSubmitting: boolean;
  error: string | null;
}

export interface SellWizardProps {
  onPublish: (formData: SellFormData) => Promise<string>;
  onCancel: () => void;
  isDevMode?: boolean;
}

export interface PhotoUploadStepProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
  isDevMode?: boolean;
}

export interface CategoryStepProps {
  selectedCategory: CategoryId | '';
  onCategorySelect: (category: CategoryId) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ProductInfoStepProps {
  formData: SellFormData;
  onFormChange: (data: Partial<SellFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isDevMode?: boolean;
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
  onBackToHome: () => void;
}
```

- [ ] **Step 3: Update `apps/mobile/features/sell/hooks/useSellForm.ts`**

Update `initialFormData` to match the new `SellFormData` shape:

```ts
// features/sell/hooks/useSellForm.ts
import { useState, useCallback } from 'react';
import type { SellFormData, WizardStep } from '../types';

const initialFormData: SellFormData = {
  photos: [],
  category: '',
  subcategory: '',
  attributes: {},
  name: '',
  price: 0,
  description: '',
  location: null,
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
    setCurrentStep(prev => (prev < 4 ? (prev + 1) as WizardStep : prev));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev === 3) return 1 as WizardStep;
      return prev > 1 ? (prev - 1) as WizardStep : prev;
    });
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

- [ ] **Step 4: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: errors only in files that still import `CATEGORY_OPTIONS`, `CONDITION_OPTIONS`, or `ProductCondition` — those are fixed in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/types.ts apps/mobile/features/sell/types.ts apps/mobile/features/sell/hooks/useSellForm.ts
git commit -m "feat: update SellFormData — replace condition with subcategory + attributes, use shared CategoryId/SubcategoryId types"
```

---

## Task 5: Update SellFormContext

**Files:**
- Modify: `apps/mobile/features/sell/context/SellFormContext.tsx`

- [ ] **Step 1: Rewrite `SellFormContext.tsx`**

Update `initialFormData` (add `subcategory`, `attributes`; remove `condition`). Update `hasData` check:

```tsx
// features/sell/context/SellFormContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { SellFormData } from '../types';

const initialFormData: SellFormData = {
  photos: [],
  category: '',
  subcategory: '',
  attributes: {},
  name: '',
  price: 0,
  description: '',
  location: null,
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

  const hasData = useMemo(
    () =>
      formData.photos.length > 0 ||
      formData.category !== '' ||
      formData.subcategory !== '' ||
      formData.name !== '' ||
      formData.price !== 0 ||
      formData.description !== '' ||
      formData.location !== null,
    [formData],
  );

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

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: SellFormContext errors resolved. Remaining errors in CategoryStep, ProductInfoStep, ReviewStep.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/sell/context/SellFormContext.tsx
git commit -m "feat: update SellFormContext initial state for subcategory and attributes"
```

---

## Task 6: Update CategoryStep

**Files:**
- Modify: `apps/mobile/features/sell/components/CategoryStep.tsx`

- [ ] **Step 1: Rewrite `CategoryStep.tsx`**

Import `CATEGORIES` from shared package instead of `CATEGORY_OPTIONS` from `lib/types`. Simplify `iconMap` to 3 icons (Car, Buildings, Smartphone). When subcategory is reset on category change, call `onCategorySelect` — the parent route already handles routing:

```tsx
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "@solar-icons/react-native/Linear";
import {
  Car,
  Buildings,
  Smartphone,
  Widget,
} from "@solar-icons/react-native/Linear";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@bantujual/categories";
import type { CategoryId } from "@bantujual/categories";
import type { CategoryStepProps } from "../types";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Car,
  Buildings,
  Smartphone,
  Widget,
};

export function CategoryStep({
  selectedCategory,
  onCategorySelect,
  onNext,
  onBack,
}: CategoryStepProps) {
  const insets = useSafeAreaInsets();

  const handleCategorySelect = (categoryId: CategoryId) => {
    onCategorySelect(categoryId);
  };

  const handleNext = () => {
    if (selectedCategory) {
      onNext();
    }
  };

  const renderIcon = (iconName: string, size: number, color?: string) => {
    const Icon = iconMap[iconName] || Widget;
    return <Icon size={size} color={color} />;
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Pilih Kategori
        </Text>
        <Text className="text-gray-500 mb-6">
          Pilih kategori yang sesuai dengan produk yang akan dijual.
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2.5">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategorySelect(category.id as CategoryId)}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-white border-gray-200"
                }`}
                activeOpacity={0.8}
              >
                {renderIcon(
                  category.icon,
                  18,
                  isSelected ? "#FFFFFF" : "#155DFC",
                )}
                <Text
                  className={`ml-2 text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-700"
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-4 pb-6 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <View className="flex-row gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={18} color="#000000" />}
            onPress={onBack}
          />
          <Button
            onPress={handleNext}
            disabled={!selectedCategory}
            style={{ flex: 1 }}
          >
            Lanjut
          </Button>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: CategoryStep errors resolved. Remaining errors in ProductInfoStep and ReviewStep.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/sell/components/CategoryStep.tsx
git commit -m "feat: update CategoryStep to use shared CATEGORIES package (3 categories)"
```

---

## Task 7: Rewrite ProductInfoStep with subcategory + dynamic attributes

**Files:**
- Modify: `apps/mobile/features/sell/components/ProductInfoStep.tsx`

- [ ] **Step 1: Rewrite `ProductInfoStep.tsx`**

Remove condition picker. Add subcategory chips (shown after common fields). Add dynamic attribute fields (shown after subcategory is picked). Validation updated to require subcategory + required attributes:

```tsx
// features/sell/components/ProductInfoStep.tsx
import { useState, useEffect } from 'react';
import {
  ActionSheetIOS,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPoint, Tag } from "@solar-icons/react-native/Linear";
import { CityPicker } from '@/features/shared/components/CityPicker';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@bantujual/categories";
import type { CategoryAttribute } from "@bantujual/categories";
import type { ProductInfoStepProps } from "../types";

const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;
const INPUT_CONTAINER = "border border-gray-300 rounded-xl bg-white overflow-hidden";

function AttributeField({
  attribute,
  value,
  onChange,
}: {
  attribute: CategoryAttribute;
  value: string | number | undefined;
  onChange: (val: string | number) => void;
}) {
  const showIOSPicker = () => {
    if (attribute.type !== 'select' || !attribute.options) return;
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Batal', ...attribute.options], cancelButtonIndex: 0 },
      (i) => { if (i !== 0 && attribute.options) onChange(attribute.options[i - 1]); }
    );
  };

  if (attribute.type === 'select' && attribute.options) {
    const useChips = attribute.options.length <= 5;
    return (
      <View className="mb-5">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {attribute.label}
          {attribute.required && <Text className="text-red-500"> *</Text>}
        </Text>
        {useChips ? (
          <View className="flex-row flex-wrap gap-2">
            {attribute.options.map((opt) => {
              const isSelected = value === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => onChange(opt)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className={INPUT_CONTAINER}>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                onPress={showIOSPicker}
                className="px-4 flex-row items-center justify-between"
                style={{ height: INPUT_HEIGHT }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: INPUT_FONT_SIZE, color: value ? '#111827' : '#9CA3AF' }}>
                  {value ? String(value) : `Pilih ${attribute.label.toLowerCase()}...`}
                </Text>
                <View className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400" />
              </TouchableOpacity>
            ) : (
              <Picker
                selectedValue={value ? String(value) : ''}
                onValueChange={(v) => { if (v) onChange(v); }}
                dropdownIconColor="#9CA3AF"
              >
                <Picker.Item label={`Pilih ${attribute.label.toLowerCase()}...`} value="" color="#9CA3AF" />
                {attribute.options.map((opt) => (
                  <Picker.Item key={opt} label={opt} value={opt} />
                ))}
              </Picker>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="mb-5">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {attribute.label}
        {attribute.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`${INPUT_CONTAINER} px-4 text-gray-900`}
        style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
        value={value !== undefined && value !== '' ? String(value) : ''}
        onChangeText={(text) => {
          if (attribute.type === 'number') {
            const num = text.replace(/[^0-9]/g, '');
            onChange(num ? parseInt(num, 10) : '');
          } else {
            onChange(text);
          }
        }}
        placeholder={attribute.label}
        placeholderTextColor="#9CA3AF"
        keyboardType={attribute.type === 'number' ? 'number-pad' : 'default'}
      />
    </View>
  );
}

export function ProductInfoStep({
  formData,
  onFormChange,
  onNext,
  onBack,
  isDevMode = false,
}: ProductInfoStepProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    if (!formData.location && user?.location) {
      onFormChange({ location: user.location });
    }
  }, []);

  const selectedCategoryDef = CATEGORIES.find(c => c.id === formData.category);
  const selectedSubcategoryDef = selectedCategoryDef?.subcategories.find(
    s => s.id === formData.subcategory
  );
  const allAttributes = [
    ...(selectedCategoryDef?.sharedAttributes ?? []),
    ...(selectedSubcategoryDef?.attributes ?? []),
  ];

  const validateAndProceed = () => {
    if (formData.name.length < 3) return;
    if (formData.price < 1000) return;
    if (!formData.location) return;
    if (!formData.subcategory) return;
    const requiredFilled = allAttributes
      .filter(a => a.required)
      .every(a => {
        const v = formData.attributes[a.id];
        return v !== undefined && v !== '';
      });
    if (!requiredFilled) return;
    onNext();
  };

  const isNameValid = formData.name.length >= 3;
  const isPriceValid = formData.price >= 1000;
  const isLocationValid = formData.location !== null;
  const isSubcategoryValid = formData.subcategory !== '';
  const requiredAttributesFilled = allAttributes
    .filter(a => a.required)
    .every(a => {
      const v = formData.attributes[a.id];
      return v !== undefined && v !== '';
    });
  const canProceed = isDevMode || (
    isNameValid && isPriceValid && isLocationValid &&
    isSubcategoryValid && requiredAttributesFilled
  );

  const handlePriceChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    onFormChange({ price: numeric ? parseInt(numeric, 10) : 0 });
  };

  const formatPriceDisplay = (value: number): string => {
    if (!value || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Info Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Isi informasi dasar produk yang akan dijual.
        </Text>

        {/* Selected Category Display */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">Kategori Dipilih</Text>
          <View className="flex-row items-center bg-orange/10 border border-orange/20 rounded-xl px-4 py-3">
            <Tag size={18} color="#F97316" />
            <Text className="ml-2 text-gray-900 font-medium">
              {selectedCategoryDef?.label ?? formData.category}
            </Text>
          </View>
        </View>

        {/* Nama Produk */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Nama Produk <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`${INPUT_CONTAINER} px-4 text-gray-900`}
            style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
            value={formData.name}
            onChangeText={(text) => onFormChange({ name: text })}
            placeholder="Contoh: Honda Beat 2020 Mulus"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
          <View className="flex-row justify-between mt-1">
            <Text className={`text-xs ${!isNameValid && formData.name.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {!isNameValid && formData.name.length > 0 ? 'Minimal 3 karakter' : ''}
            </Text>
            <Text className="text-xs text-gray-400">{formData.name.length}/100</Text>
          </View>
        </View>

        {/* Harga */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Harga <Text className="text-red-500">*</Text>
          </Text>
          <View className={`${INPUT_CONTAINER} flex-row items-center`} style={{ height: INPUT_HEIGHT }}>
            <Text className="text-gray-500 ml-4 mr-2" style={{ fontSize: INPUT_FONT_SIZE }}>Rp</Text>
            <TextInput
              className="flex-1 pr-4 text-gray-900"
              style={{ fontSize: INPUT_FONT_SIZE }}
              value={formatPriceDisplay(formData.price)}
              onChangeText={handlePriceChange}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={12}
            />
          </View>
          <Text className={`text-xs mt-1 ${!isPriceValid && formData.price > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {!isPriceValid && formData.price > 0 ? 'Harga minimal Rp 1.000' : 'Minimal Rp 1.000'}
          </Text>
        </View>

        {/* Deskripsi */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Deskripsi <Text className="text-gray-400">(opsional)</Text>
          </Text>
          <TextInput
            className={`${INPUT_CONTAINER} px-4 pt-3 text-gray-900`}
            value={formData.description}
            onChangeText={(text) => onFormChange({ description: text })}
            placeholder="Jelaskan kondisi barang, ukuran, warna, dll"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ height: 100, fontSize: INPUT_FONT_SIZE }}
            maxLength={500}
          />
          <Text className="text-xs text-gray-400 mt-1 text-right">
            {formData.description.length}/500
          </Text>
        </View>

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
            <MapPoint size={16} color={formData.location ? '#155DFC' : '#9CA3AF'} />
            <Text
              className="flex-1 ml-2"
              style={{ fontSize: INPUT_FONT_SIZE, color: formData.location ? '#111827' : '#9CA3AF' }}
            >
              {formData.location ? formData.location.name : 'Pilih kota...'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subkategori */}
        {selectedCategoryDef && (
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Jenis <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedCategoryDef.subcategories.map((sub) => {
                const isSelected = formData.subcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => onFormChange({ subcategory: sub.id as typeof formData.subcategory, attributes: {} })}
                    className={`px-4 py-2.5 rounded-xl border ${
                      isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Dynamic Attribute Fields */}
        {formData.subcategory !== '' && allAttributes.map((attr) => (
          <AttributeField
            key={attr.id}
            attribute={attr}
            value={formData.attributes[attr.id]}
            onChange={(val) =>
              onFormChange({ attributes: { ...formData.attributes, [attr.id]: val } })
            }
          />
        ))}
      </ScrollView>

      {showCityPicker && (
        <CityPicker
          value={formData.location}
          onSelect={(loc) => { onFormChange({ location: loc }); setShowCityPicker(false); }}
          onClose={() => setShowCityPicker(false)}
        />
      )}

      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-6"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <View className="flex-row gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={18} color="#000000" />}
            onPress={onBack}
          />
          <Button
            onPress={isDevMode ? onNext : validateAndProceed}
            disabled={!canProceed}
            style={{ flex: 1 }}
          >
            Lanjut ke Review
          </Button>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Run type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: ProductInfoStep errors resolved. Only ReviewStep errors remain.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/sell/components/ProductInfoStep.tsx
git commit -m "feat: rewrite ProductInfoStep — add subcategory chips and dynamic attribute fields"
```

---

## Task 8: Update ReviewStep

**Files:**
- Modify: `apps/mobile/features/sell/components/ReviewStep.tsx`

- [ ] **Step 1: Rewrite `ReviewStep.tsx`**

Replace `getCategoryLabel` to use `CATEGORIES`. Remove `getConditionLabel`. Pass category label (with subcategory) to `ProductDetailData`. Note: `ProductDetailData.condition` is optional — pass it from `attributes.condition` if present:

```tsx
// features/sell/components/ReviewStep.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { Button } from '@/components/ui/Button';
import { ProductDetail, type ProductDetailData } from '@/features/product/ProductDetail';
import { CATEGORIES } from '@bantujual/categories';
import type { ReviewStepProps } from '../types';

function formatRupiah(value: number): string {
  if (!value || value === 0) return 'Rp 0';
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function ReviewStep({
  formData,
  isSubmitting,
  onEditPhotos,
  onEditInfo,
  onPublish,
  onBack,
}: ReviewStepProps) {
  const insets = useSafeAreaInsets();

  const categoryDef = CATEGORIES.find(c => c.id === formData.category);
  const subcategoryDef = categoryDef?.subcategories.find(s => s.id === formData.subcategory);
  const categoryLabel = subcategoryDef
    ? `${categoryDef?.label} › ${subcategoryDef.label}`
    : categoryDef?.label ?? formData.category;

  const productForPreview: ProductDetailData = {
    name: formData.name,
    price: formData.price,
    description: formData.description,
    photos: formData.photos,
    category: categoryLabel,
    condition: formData.attributes.condition ? String(formData.attributes.condition) : undefined,
  };

  const footerContent = (
    <View className="flex-row gap-3 items-center">
      <Button
        variant="outline"
        size="sm"
        icon={<ArrowLeft size={18} color="#000000" />}
        onPress={onBack}
        disabled={isSubmitting}
      />
      <Button
        onPress={onPublish}
        disabled={isSubmitting}
        loading={isSubmitting}
        style={{ flex: 1 }}
      >
        Publish Sekarang
      </Button>
    </View>
  );

  return (
    <ProductDetail
      product={productForPreview}
      showActions={false}
      showSeller={false}
      footerContent={footerContent}
    />
  );
}
```

- [ ] **Step 2: Run type check — expect clean**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/sell/components/ReviewStep.tsx
git commit -m "feat: update ReviewStep — use shared CATEGORIES for labels, read condition from attributes"
```

---

## Final Verification

- [ ] **Run full mobile type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: exits 0

- [ ] **Start mobile dev server and manually verify sell flow**

```bash
cd apps/mobile && npx expo start
```

Verify:
1. Kategori step shows 3 categories (Kendaraan, Properti, Handphone & Tablet)
2. After picking Kendaraan, info step shows subcategory chips (Mobil / Motor)
3. After picking Mobil, attribute fields appear: Kondisi, Tahun, Kilometer, Merk (picker), Tipe, Bahan Bakar
4. After picking Properti → Tanah, only shared attributes appear (Status, Sertifikat, Luas Lahan) — no building_area or floors
5. After picking Properti → Rumah, building_area and floors fields appear
6. Next button stays disabled until all required attributes are filled
7. ReviewStep shows "Kendaraan › Mobil" as category label
