# Category Management System — Design Spec

**Date:** 2026-06-01
**Status:** Approved

## Overview

A shared TypeScript package (`packages/categories/`) serves as the single source of truth for all category definitions, subcategories, attribute schemas, and UI metadata. Mobile, backend, and future web all import from this package. No admin management — the developer controls categories via code.

---

## 1. Shared Package Structure

**Location:** `packages/categories/index.ts`

No `package.json` — each app references it via tsconfig path alias `@bantujual/categories`.

### Types

```ts
export interface CategoryAttribute {
  id: string
  label: string
  type: 'select' | 'number' | 'text'
  options?: string[]   // only for type 'select'
  required: boolean
}

export interface SubcategoryDefinition {
  id: string
  label: string
  attributes: CategoryAttribute[]  // sub-specific, rendered after sharedAttributes
}

export interface CategoryDefinition {
  id: string
  label: string
  icon: string         // Solar icon name — frontend maps to component
  subcategories: SubcategoryDefinition[]
  sharedAttributes: CategoryAttribute[]  // applies to all subcategories
}

export const CATEGORIES: readonly CategoryDefinition[]

export type CategoryId = typeof CATEGORIES[number]['id']
export type SubcategoryId = typeof CATEGORIES[number]['subcategories'][number]['id']
```

### Categories

**Kendaraan** (`id: 'kendaraan'`, icon: `'Car'`)

Subcategories: `mobil`, `motor`

Shared attributes:
| id | label | type | options | required |
|---|---|---|---|---|
| `condition` | Kondisi | select | baru, bekas | true |
| `year` | Tahun | number | — | true |
| `mileage` | Kilometer | number | — | true |
| `brand` | Merk | select | Toyota, Honda, Suzuki, Yamaha, Kawasaki, Daihatsu, Mitsubishi, Nissan, Mazda, BMW, Mercedes-Benz, Lainnya | true |
| `model` | Tipe | text | — | false |
| `fuel` | Bahan Bakar | select | bensin, solar, listrik, hybrid | true |

Sub-specific attributes: none (both `mobil` and `motor` share all attributes above)

---

**Properti** (`id: 'properti'`, icon: `'Buildings'`)

Subcategories: `rumah`, `tanah`, `apartemen`, `kantor`, `ruko`

Shared attributes:
| id | label | type | options | required |
|---|---|---|---|---|
| `listing_type` | Status | select | jual, sewa | true |
| `certificate` | Sertifikat | select | SHM, SHGB, Girik, Strata Title, Lainnya | true |
| `land_area` | Luas Lahan (m²) | number | — | true |

Sub-specific attributes:
- `tanah` — none (no building)
- `rumah`, `apartemen`, `kantor`, `ruko` — `building_area` (Luas Bangunan, required) + `floors` (Jumlah Lantai, required for rumah/ruko, optional for apartemen/kantor)

---

**Handphone & Tablet** (`id: 'handphone-tablet'`, icon: `'Smartphone'`)

Subcategories: `handphone`, `tablet`, `aksesoris-gadget`

Shared attributes:
| id | label | type | options | required |
|---|---|---|---|---|
| `condition` | Kondisi | select | baru, bekas | true |
| `brand` | Merk | text | — | true |

Sub-specific attributes: none

---

## 2. Database Changes

**File:** `apps/backend/src/core/db/schema.ts`

### Enums (derived from shared package)

```ts
import { CATEGORIES } from '@bantujual/categories'

export const productCategoryEnum = pgEnum('product_category',
  CATEGORIES.map(c => c.id) as [string, ...string[]])

export const productSubcategoryEnum = pgEnum('product_subcategory',
  CATEGORIES.flatMap(c => c.subcategories.map(s => s.id)) as [string, ...string[]])
```

Enums are now auto-synced with `packages/categories` — no drift possible.

### Products table additions

```ts
export const products = pgTable('products', {
  // ... existing columns ...
  category: productCategoryEnum('category').notNull(),
  subcategory: productSubcategoryEnum('subcategory').notNull(),
  attributes: jsonb('attributes').notNull().default({}),
}, (t) => [
  index('products_seller_id_idx').on(t.sellerId),
  index('products_category_idx').on(t.category),
  index('products_subcategory_idx').on(t.subcategory),
  index('products_attributes_idx').using('gin', t.attributes),
])
```

`subcategory` is a proper indexed column (not JSONB) to support efficient filtering like "show all Mobil."

`attributes` stores `Record<string, string | number>` — keys match `CategoryAttribute.id` values for the selected category + subcategory.

### Backend validation

On product create/update, backend validates that:
1. `subcategory` belongs to the selected `category`
2. All `required` attributes for the category + subcategory are present in `attributes`
3. `select` attribute values are one of the defined `options`

---

## 3. App Setup (tsconfig + Metro)

### Backend — `apps/backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@bantujual/categories": ["../../packages/categories/index.ts"]
    }
  }
}
```

### Mobile — `apps/mobile/tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@bantujual/categories": ["../../packages/categories/index.ts"]
    }
  }
}
```

### Mobile — `apps/mobile/metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)
config.watchFolders = [path.resolve(__dirname, '../../packages')]
module.exports = config
```

### Web (future)

Add tsconfig path alias only — same as backend.

---

## 4. Mobile Changes

### `apps/mobile/lib/types.ts`

Remove: `ProductCategory`, `CategoryOption`, `CATEGORY_OPTIONS`

Replace with: `import { CategoryId, SubcategoryId } from '@bantujual/categories'`

### `apps/mobile/features/sell/types.ts`

```ts
export interface SellFormData {
  photos: string[]
  category: CategoryId | ''
  subcategory: SubcategoryId | ''
  attributes: Record<string, string | number>  // includes condition, brand, etc.
  name: string
  price: number
  description: string
  location: Location | null
}
```

### Sell wizard flow

| Step | Screen | Content |
|---|---|---|
| 1 | Foto | Photo upload |
| 2 | Kategori | Pick 1 of 3 main categories |
| 3 | Info | Nama + harga + deskripsi + lokasi + **subkategori chips** + **attribute fields** (dynamic) |
| 4 | Review | Confirm before publish |

### `ProductInfoStep` dynamic rendering

After the common fields (nama, harga, deskripsi, lokasi), the step renders:

1. **Subkategori chips** — derived from `CATEGORIES.find(c => c.id === category)?.subcategories`
2. **Attribute fields** — once subcategory is selected, renders `sharedAttributes` + `subcategory.attributes` in order
3. Next button disabled until all `required` attributes are filled

The `iconMap` (Solar icon name → React Native component) stays in `CategoryStep.tsx` — it's a UI concern, not data.

---

## 5. What Does NOT Change

- Universal fields (nama, harga, deskripsi, lokasi) remain in `SellFormData` as dedicated typed fields — not in `attributes`
- `ProductCondition` type in `lib/types.ts` is removed — condition is now a category attribute (`attributes.condition`) for categories that need it, not a universal field
- Sell wizard step count stays at 4
- `CategoryStep` UI (chip grid) stays the same — only the source of data changes from `CATEGORY_OPTIONS` to `CATEGORIES`
