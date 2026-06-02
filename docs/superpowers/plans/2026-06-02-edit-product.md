# Edit Product — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow sellers to edit their own products through a 4-step wizard (identical to sell flow) with an edit button in the product detail header.

**Architecture:** Separate `features/edit/` folder with its own `EditFormContext` (pre-filled from product data) and `app/(protected)/edit/[id]/` route group. Backend needs a new `PATCH /products/:id` endpoint. Reuse sell step components where possible; create edit-specific variants only where the data model differs (photos).

**Tech Stack:** React Native / Expo Router v6, NativeWind v4, TanStack Query, Hono (backend), Drizzle ORM, Zod, Vitest

---

## File Map

### Backend — new/modified

| File | Change |
|---|---|
| `apps/backend/src/modules/products/products.validation.ts` | Add `updateProductSchema`, `UpdateProductInput` |
| `apps/backend/src/modules/products/products.repository.ts` | Add `findByIdForEdit`, `update` to interface + impl; add `UpdateProductRepoInput` |
| `apps/backend/src/modules/products/products.service.ts` | Add `updateProduct` method |
| `apps/backend/src/modules/products/products.routes.ts` | Add `PATCH /:id` route |
| `apps/backend/src/modules/products/products.service.test.ts` | Add tests for `updateProduct` |
| `apps/backend/src/modules/products/products.routes.test.ts` | Add tests for `PATCH /:id` |

### Mobile — new files

| File | Purpose |
|---|---|
| `apps/mobile/features/edit/types.ts` | `EditPhoto`, `EditFormData` types |
| `apps/mobile/features/edit/context/EditFormContext.tsx` | Wizard state, initialized from product data |
| `apps/mobile/features/edit/components/EditPhotoUploadStep.tsx` | Photo step adapted for `EditPhoto[]` |
| `apps/mobile/features/edit/components/EditSuccessScreen.tsx` | Post-edit success screen |
| `apps/mobile/app/(protected)/edit/[id]/_layout.tsx` | Wizard shell: fetch + provider + stepper |
| `apps/mobile/app/(protected)/edit/[id]/foto.tsx` | Step 1 route |
| `apps/mobile/app/(protected)/edit/[id]/kategori.tsx` | Step 2 route |
| `apps/mobile/app/(protected)/edit/[id]/info.tsx` | Step 3 route |
| `apps/mobile/app/(protected)/edit/[id]/review.tsx` | Step 4 route |
| `apps/mobile/app/(protected)/edit/[id]/success.tsx` | Success route |

### Mobile — modified files

| File | Change |
|---|---|
| `apps/mobile/lib/api.ts` | Add `authPatch` helper + `updateProduct` function |
| `apps/mobile/features/product/ProductDetailScreen.tsx` | Add edit button for product owner |

---

## Task 1: Backend — updateProductSchema

**Files:**
- Modify: `apps/backend/src/modules/products/products.validation.ts`

- [ ] **Step 1: Add the schema**

Open `apps/backend/src/modules/products/products.validation.ts` and append after `createProductSchema`:

```typescript
export const updateProductSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().int().min(1000),
  description: z.string().max(500).optional().default(''),
  category: z.enum(categoryIds),
  subcategory: z.enum(subcategoryIds),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])),
  location: z.object({
    name: z.string().min(1),
    placeId: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  }),
  photos: z
    .array(
      z.string().refine(
        v => v.startsWith('https://') || (v.startsWith('products/uploads/') && !v.includes('..')),
        'Photo must be a public URL or a valid upload key',
      ),
    )
    .min(1)
    .max(6),
  listingStatus: z.enum(['draft', 'active']),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/products/products.validation.ts
git commit -m "feat(backend): add updateProductSchema for product edit"
```

---

## Task 2: Backend — repository update methods

**Files:**
- Modify: `apps/backend/src/modules/products/products.repository.ts`

- [ ] **Step 1: Write the failing test for `findByIdForEdit` and `update`**

In `apps/backend/src/modules/products/products.repository.test.ts`, find the existing `describe` block and add:

```typescript
describe('findByIdForEdit', () => {
  it('returns product regardless of approval status', async () => {
    const user = await usersRepository.create({ email: 'edit-find@example.com' });
    const token = await signAccessToken(user.id);

    // Create a product (approvalStatus = pending by default)
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    }, testEnv);
    const body = await res.json() as any;
    const productId = body.product.id;

    const row = await productsRepository.findByIdForEdit(productId);
    expect(row).not.toBeNull();
    expect(row!.id).toBe(productId);
    expect(row!.seller.id).toBe(user.id);
  });

  it('returns null for non-existent product', async () => {
    const row = await productsRepository.findByIdForEdit('00000000-0000-0000-0000-000000000000');
    expect(row).toBeNull();
  });
});

describe('update', () => {
  it('replaces product fields and photos', async () => {
    const user = await usersRepository.create({ email: 'edit-update@example.com' });
    const token = await signAccessToken(user.id);

    const createRes = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    }, testEnv);
    const createBody = await createRes.json() as any;
    const productId = createBody.product.id;

    const updated = await productsRepository.update(productId, {
      name: 'Updated Name',
      price: 200_000_000,
      description: 'Updated desc',
      category: 'kendaraan',
      subcategory: 'mobil',
      attributes: { brand: 'Toyota', condition: 'Bekas', year: 2021, mileage: 20000, fuel: 'Bensin' },
      listingStatus: 'active',
      locationName: 'Bandung',
      locationPlaceId: 'ChIJplace456',
      locationLat: -6.9,
      locationLng: 107.6,
      photos: [{ url: 'https://cdn.test.example.com/products/uploads/new-0.jpg', position: 0 }],
    });

    expect(updated.product.name).toBe('Updated Name');
    expect(updated.product.price).toBe(200_000_000);
    expect(updated.images).toHaveLength(1);
    expect(updated.images[0].url).toBe('https://cdn.test.example.com/products/uploads/new-0.jpg');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/backend && NODE_ENV=test npx vitest run src/modules/products/products.repository.test.ts
```

Expected: FAIL — `findByIdForEdit is not a function`, `update is not a function`.

- [ ] **Step 3: Add `UpdateProductRepoInput` and interface methods**

In `apps/backend/src/modules/products/products.repository.ts`, add after `CreateProductRepoInput`:

```typescript
export interface UpdateProductRepoInput {
  name: string;
  price: number;
  description: string;
  category: string;
  subcategory: string;
  attributes: Record<string, string | number>;
  listingStatus: 'draft' | 'active';
  locationName: string;
  locationPlaceId: string;
  locationLat: number;
  locationLng: number;
  photos: { url: string; position: number }[];
}
```

Update the `ProductsRepository` interface to add:

```typescript
export interface ProductsRepository {
  create(input: CreateProductRepoInput): Promise<{ product: Product; images: ProductImage[] }>;
  update(id: string, input: UpdateProductRepoInput): Promise<{ product: Product; images: ProductImage[] }>;
  findById(id: string): Promise<ProductDetailRow | null>;
  findByIdForEdit(id: string): Promise<ProductDetailRow | null>;
  list(filters: ListFilters): Promise<{ rows: ProductListRow[]; nextCursor: string | null }>;
  countForSeller(sellerId: string): Promise<number>;
}
```

- [ ] **Step 4: Implement `findByIdForEdit` and `update` in `createProductsRepository`**

Inside `createProductsRepository`, after the `findById` method, add:

```typescript
async findByIdForEdit(id) {
  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      description: products.description,
      category: products.category,
      subcategory: products.subcategory,
      attributes: products.attributes,
      listingStatus: products.listingStatus,
      approvalStatus: products.approvalStatus,
      locationName: products.locationName,
      locationLat: products.locationLat,
      locationLng: products.locationLng,
      createdAt: products.createdAt,
      sellerId: users.id,
      sellerName: users.name,
      sellerAvatarUrl: users.avatarUrl,
    })
    .from(products)
    .innerJoin(users, eq(products.sellerId, users.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!row) return null;

  const photos = await db
    .select({ url: productImages.url, position: productImages.position })
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.position));

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    attributes: row.attributes as Record<string, string | number>,
    listingStatus: row.listingStatus,
    approvalStatus: row.approvalStatus,
    locationName: row.locationName,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    createdAt: row.createdAt,
    seller: { id: row.sellerId, name: row.sellerName, avatarUrl: row.sellerAvatarUrl },
    photos,
  };
},

async update(id, input) {
  const { photos, ...productData } = input;
  return db.transaction(async (tx) => {
    const [product] = await tx
      .update(products)
      .set({
        name: productData.name,
        price: productData.price,
        description: productData.description,
        category: productData.category as never,
        subcategory: productData.subcategory as never,
        attributes: productData.attributes,
        listingStatus: productData.listingStatus as never,
        locationName: productData.locationName,
        locationPlaceId: productData.locationPlaceId,
        locationLat: productData.locationLat,
        locationLng: productData.locationLng,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    await tx.delete(productImages).where(eq(productImages.productId, id));

    const images = await tx
      .insert(productImages)
      .values(photos.map(p => ({ productId: id, url: p.url, position: p.position })))
      .returning();

    return { product, images };
  });
},
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/backend && NODE_ENV=test npx vitest run src/modules/products/products.repository.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/products/products.repository.ts \
        apps/backend/src/modules/products/products.repository.test.ts
git commit -m "feat(backend): add findByIdForEdit and update to products repository"
```

---

## Task 3: Backend — updateProduct service method

**Files:**
- Modify: `apps/backend/src/modules/products/products.service.ts`
- Modify: `apps/backend/src/modules/products/products.service.test.ts`

- [ ] **Step 1: Write failing service tests**

In `apps/backend/src/modules/products/products.service.test.ts`, add to the `makeFakeRepo` function a stub for the two new methods, and add a new `describe` block:

Update `makeFakeRepo` to include stubs:

```typescript
function makeFakeRepo(): { repo: ProductsRepository; getLastInput: () => CreateProductRepoInput | null; getLastUpdateInput: () => { id: string; input: UpdateProductRepoInput } | null } {
  let captured: CreateProductRepoInput | null = null;
  let capturedUpdate: { id: string; input: UpdateProductRepoInput } | null = null;
  return {
    repo: {
      async create(input) {
        captured = input;
        return { product: { ...stubProduct } as Product, images: [stubImage] };
      },
      async update(id, input) {
        capturedUpdate = { id, input };
        return { product: { ...stubProduct, ...input } as unknown as Product, images: [stubImage] };
      },
      async list() { return { rows: [], nextCursor: null }; },
      async findById() { return null; },
      async findByIdForEdit() { return null; },
      async countForSeller() { return 0; },
    },
    getLastInput: () => captured,
    getLastUpdateInput: () => capturedUpdate,
  };
}
```

Add new `describe` block:

```typescript
describe('updateProduct', () => {
  const updateInput = {
    name: 'Toyota Avanza Updated',
    price: 160_000_000,
    description: 'Updated',
    category: 'kendaraan' as const,
    subcategory: 'mobil' as const,
    attributes: { brand: 'Toyota', condition: 'Bekas', year: 2021, mileage: 20000, fuel: 'Bensin' },
    location: { name: 'Bandung', placeId: 'p456', lat: -6.9, lng: 107.6 },
    photos: ['https://cdn.test.example.com/products/uploads/existing.jpg'],
    listingStatus: 'active' as const,
  };

  it('throws NotFoundError when product not found', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.updateProduct('prod-uuid', 'user-uuid', updateInput),
    ).rejects.toThrow('Product not found');
  });

  it('throws ForbiddenError when user is not the seller', async () => {
    const { repo } = makeFakeRepo();
    // Override findByIdForEdit to return a product owned by a different user
    repo.findByIdForEdit = async () => ({
      ...stubDetailRow,
      seller: { id: 'other-user', name: null, avatarUrl: null },
    });
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.updateProduct('prod-uuid', 'user-uuid', updateInput),
    ).rejects.toThrow('Forbidden');
  });

  it('converts new photo keys to URLs and keeps existing URLs', async () => {
    const { repo, getLastUpdateInput } = makeFakeRepo();
    repo.findByIdForEdit = async () => ({
      ...stubDetailRow,
      seller: { id: 'user-uuid', name: null, avatarUrl: null },
    });
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.updateProduct('prod-uuid', 'user-uuid', {
      ...updateInput,
      photos: [
        'https://cdn.test.example.com/products/uploads/existing.jpg',
        'products/uploads/new-key.jpg',
      ],
    });
    const last = getLastUpdateInput()!;
    expect(last.input.photos[0].url).toBe('https://cdn.test.example.com/products/uploads/existing.jpg');
    expect(last.input.photos[1].url).toBe('https://fake-r2.test/products/uploads/new-key.jpg');
  });
});
```

Add `stubDetailRow` near the top of the test file (after `stubImage`):

```typescript
const stubDetailRow = {
  id: 'prod-uuid',
  name: 'Test',
  price: 150_000_000,
  description: '',
  category: 'kendaraan',
  subcategory: 'mobil',
  attributes: {},
  listingStatus: 'active',
  approvalStatus: 'pending',
  locationName: 'Jakarta',
  locationLat: -6.2,
  locationLng: 106.8,
  createdAt: new Date(),
  seller: { id: 'user-uuid', name: null, avatarUrl: null },
  photos: [],
};
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/backend && NODE_ENV=test npx vitest run src/modules/products/products.service.test.ts
```

Expected: FAIL — `service.updateProduct is not a function`.

- [ ] **Step 3: Implement `updateProduct` in the service**

`ForbiddenError` already exists in `apps/backend/src/core/errors.ts`. Add the import for it alongside `NotFoundError` at the top of the service file, then add the method inside `createProductsService`:

```typescript
async updateProduct(
  productId: string,
  requestingUserId: string,
  input: import('./products.validation').UpdateProductInput,
): Promise<void> {
  const existing = await repo.findByIdForEdit(productId);
  if (!existing) throw new NotFoundError('Product not found');
  if (existing.seller.id !== requestingUserId) throw new ForbiddenError();

  validateCategoryAndAttributes(input.category, input.subcategory, input.attributes);

  const photos = input.photos.map((photoValue, position) => {
    const url = photoValue.startsWith('https://')
      ? photoValue
      : storage.keyToPublicUrl(photoValue);
    return { url, position };
  });

  await repo.update(productId, {
    name: input.name,
    price: input.price,
    description: input.description,
    category: input.category,
    subcategory: input.subcategory,
    attributes: input.attributes,
    listingStatus: input.listingStatus,
    locationName: input.location.name,
    locationPlaceId: input.location.placeId,
    locationLat: input.location.lat,
    locationLng: input.location.lng,
    photos,
  });
},
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/backend && NODE_ENV=test npx vitest run src/modules/products/products.service.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/products/products.service.ts \
        apps/backend/src/modules/products/products.service.test.ts
git commit -m "feat(backend): add updateProduct service method"
```

---

## Task 4: Backend — PATCH route + integration tests

**Files:**
- Modify: `apps/backend/src/modules/products/products.routes.ts`
- Modify: `apps/backend/src/modules/products/products.routes.test.ts`

- [ ] **Step 1: Write failing integration tests**

In `apps/backend/src/modules/products/products.routes.test.ts`, add a new `describe` block at the end:

```typescript
describe('PATCH /products/:id', () => {
  const patchPayload = {
    name: 'Toyota Avanza Updated',
    price: 160_000_000,
    description: 'Updated description',
    category: 'kendaraan',
    subcategory: 'mobil',
    attributes: { brand: 'Toyota', condition: 'Bekas', year: 2021, mileage: 20000, fuel: 'Bensin' },
    location: { name: 'Bandung', placeId: 'ChIJplace456', lat: -6.9, lng: 107.6 },
    photos: ['products/uploads/test-0.jpg'],
    listingStatus: 'active',
  };

  it('returns 401 without auth', async () => {
    const res = await createApp().request('/products/some-id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    }, testEnv);
    expect(res.status).toBe(401);
  });

  it('returns 404 when product not found', async () => {
    const user = await usersRepository.create({ email: 'patch-404@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    }, testEnv);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the seller', async () => {
    const owner = await usersRepository.create({ email: 'patch-owner@example.com' });
    const other = await usersRepository.create({ email: 'patch-other@example.com' });
    const ownerToken = await signAccessToken(owner.id);
    const otherToken = await signAccessToken(other.id);

    const createRes = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    }, testEnv);
    const createBody = await createRes.json() as any;

    const res = await createApp().request(`/products/${createBody.product.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    }, testEnv);
    expect(res.status).toBe(403);
  });

  it('returns 200 and updates the product when owner patches it', async () => {
    const user = await usersRepository.create({ email: 'patch-success@example.com' });
    const token = await signAccessToken(user.id);

    const createRes = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    }, testEnv);
    const createBody = await createRes.json() as any;
    const productId = createBody.product.id;

    await db.update(productsTable).set({ approvalStatus: 'approved' }).where(eq(productsTable.id, productId));

    const res = await createApp().request(`/products/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    }, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.product.name).toBe('Toyota Avanza Updated');
    expect(body.product.price).toBe(160_000_000);
  });

  it('returns 400 for invalid payload', async () => {
    const user = await usersRepository.create({ email: 'patch-400@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products/some-id', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    }, testEnv);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/backend && NODE_ENV=test npx vitest run src/modules/products/products.routes.test.ts
```

Expected: FAIL — 401 tests may pass (route doesn't exist yet), 404/403/200 tests fail.

- [ ] **Step 3: Add PATCH route to products.routes.ts**

In `apps/backend/src/modules/products/products.routes.ts`, add these imports at the top:

```typescript
import { presignSchema, createProductSchema, updateProductSchema, feedQuerySchema, searchQuerySchema } from './products.validation';
```

Then add the PATCH route after `productsRoutes.post('/', ...)`:

```typescript
productsRoutes.patch('/:id', requireAuth, zValidator('json', updateProductSchema), async (c) => {
  const input = c.req.valid('json');
  const productId = c.req.param('id');
  const userId = c.get('user').id;
  await c.get('productsService').updateProduct(productId, userId, input);
  const product = await c.get('productsService').getProduct(productId);
  return c.json({ product });
});
```

`ForbiddenError` extends `AppError`, and the error handler already handles all `AppError` instances via `instanceof AppError` — no changes needed to the error handler.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/backend && NODE_ENV=test npx vitest run src/modules/products/products.routes.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Full backend test suite**

```bash
cd apps/backend && NODE_ENV=test npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/products/products.routes.ts \
        apps/backend/src/modules/products/products.routes.test.ts
git commit -m "feat(backend): add PATCH /products/:id endpoint for product editing"
```

---

## Task 5: Mobile — EditPhoto types + EditFormContext

**Files:**
- Create: `apps/mobile/features/edit/types.ts`
- Create: `apps/mobile/features/edit/context/EditFormContext.tsx`

- [ ] **Step 1: Create `features/edit/types.ts`**

```typescript
import type { CategoryId, SubcategoryId } from '@bantujual/categories';
import type { Location } from '@/lib/types';

export type EditPhoto =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; uri: string };

export interface EditFormData {
  productId: string;
  photos: EditPhoto[];
  category: CategoryId | '';
  subcategory: SubcategoryId | '';
  attributes: Record<string, string | number>;
  name: string;
  price: number;
  description: string;
  location: Location | null;
}
```

- [ ] **Step 2: Create `features/edit/context/EditFormContext.tsx`**

```typescript
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { EditFormData, EditPhoto } from '../types';
import type { ProductDetailItem } from '@/lib/api';

function fromProduct(product: ProductDetailItem): EditFormData {
  return {
    productId: product.id,
    photos: product.photos
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(p => ({ kind: 'existing' as const, url: p.url })),
    category: product.category as EditFormData['category'],
    subcategory: product.subcategory as EditFormData['subcategory'],
    attributes: product.attributes,
    name: product.name,
    price: product.price,
    description: product.description,
    location: product.location,
  };
}

interface EditFormContextValue {
  formData: EditFormData;
  updateFormData: (updates: Partial<EditFormData>) => void;
  hasChanges: boolean;
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
}

const EditFormContext = createContext<EditFormContextValue | undefined>(undefined);

export function EditFormProvider({
  product,
  children,
}: {
  product: ProductDetailItem;
  children: ReactNode;
}) {
  const [formData, setFormData] = useState<EditFormData>(() => fromProduct(product));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((updates: Partial<EditFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const original = useMemo(() => fromProduct(product), [product]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(original),
    [formData, original],
  );

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  return (
    <EditFormContext.Provider value={{ formData, updateFormData, hasChanges, isSubmitting, setSubmitting }}>
      {children}
    </EditFormContext.Provider>
  );
}

export function useEditFormContext() {
  const context = useContext(EditFormContext);
  if (!context) throw new Error('useEditFormContext must be used within EditFormProvider');
  return context;
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/edit/
git commit -m "feat(mobile): add EditFormContext and types for edit product"
```

---

## Task 6: Mobile — updateProduct API function

**Files:**
- Modify: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Add `authPatch` helper and `updateProduct` to `lib/api.ts`**

After the `authPost` function, add:

```typescript
async function authPatch<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

After the `publishProduct` function, add:

```typescript
export async function updateProduct(
  token: string,
  productId: string,
  photos: import('@/features/edit/types').EditPhoto[],
  payload: {
    name: string;
    price: number;
    description: string;
    category: string;
    subcategory: string;
    attributes: Record<string, string | number>;
    location: { name: string; placeId: string; lat: number; lng: number };
    listingStatus: 'active' | 'draft';
  },
): Promise<void> {
  const newPhotos = photos.filter(
    (p): p is { kind: 'new'; uri: string } => p.kind === 'new',
  );

  let newUploads: PresignUpload[] = [];
  if (newPhotos.length > 0) {
    newUploads = await presignImages(token, newPhotos.length);
    await Promise.all(
      newPhotos.map((p, i) => uploadPhotoToR2(p.uri, newUploads[i].uploadUrl)),
    );
  }

  let newIndex = 0;
  const photoValues = photos.map(p => {
    if (p.kind === 'existing') return p.url;
    return newUploads[newIndex++].key;
  });

  await authPatch<{ product: unknown }>(`/products/${productId}`, token, {
    ...payload,
    photos: photoValues,
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/api.ts
git commit -m "feat(mobile): add updateProduct API function"
```

---

## Task 7: Mobile — EditPhotoUploadStep

**Files:**
- Create: `apps/mobile/features/edit/components/EditPhotoUploadStep.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { View, Text, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { PhotoGrid } from '@/features/sell/components/PhotoGrid';
import type { EditPhoto } from '../types';

interface EditPhotoUploadStepProps {
  photos: EditPhoto[];
  onPhotosChange: (photos: EditPhoto[]) => void;
  onNext: () => void;
}

function toDisplayUris(photos: EditPhoto[]): string[] {
  return photos.map(p => (p.kind === 'existing' ? p.url : p.uri));
}

function fromDisplayUris(uris: string[], original: EditPhoto[]): EditPhoto[] {
  const lookup = new Map<string, EditPhoto>(
    original.map(p => [p.kind === 'existing' ? p.url : p.uri, p]),
  );
  return uris.map(uri => lookup.get(uri) ?? { kind: 'new', uri });
}

export function EditPhotoUploadStep({
  photos,
  onPhotosChange,
  onNext,
}: EditPhotoUploadStepProps) {
  const insets = useSafeAreaInsets();

  const displayUris = toDisplayUris(photos);

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
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newEntries: EditPhoto[] = result.assets.map(a => ({ kind: 'new', uri: a.uri }));
      onPhotosChange([...photos, ...newEntries]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const handleSetCover = (index: number) => {
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    onPhotosChange([picked, ...next]);
  };

  const handleReorder = (newUris: string[]) => {
    onPhotosChange(fromDisplayUris(newUris, photos));
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Foto Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Foto pertama akan menjadi cover. Kamu bisa menghapus atau menambah foto baru.
        </Text>

        <PhotoGrid
          photos={displayUris}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          onSetCover={handleSetCover}
          onReorder={handleReorder}
          maxPhotos={6}
        />

        {photos.length > 0 && (
          <Text className="text-sm text-gray-500 mt-4 text-center">
            {photos.length} dari 6 foto
          </Text>
        )}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <Button onPress={onNext} disabled={photos.length < 1}>
          Lanjut
        </Button>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/edit/components/EditPhotoUploadStep.tsx
git commit -m "feat(mobile): add EditPhotoUploadStep for edit flow"
```

---

## Task 8: Mobile — EditSuccessScreen

**Files:**
- Create: `apps/mobile/features/edit/components/EditSuccessScreen.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckRead } from '@solar-icons/react-native/Linear';
import { Button } from '@/components/ui/Button';

interface EditSuccessScreenProps {
  productId: string;
  onViewProduct: () => void;
  onBackToHome: () => void;
}

export function EditSuccessScreen({
  productId: _productId,
  onViewProduct,
  onBackToHome,
}: EditSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-accent" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6">
          <CheckRead size={80} color="#F97316" />
        </View>
        <Text className="text-5xl font-heading font-medium leading-snug text-center">
          Produk berhasil
        </Text>
        <Text className="text-5xl font-heading font-medium leading-snug text-center mb-3">
          diperbarui!
        </Text>
        <Text className="text-center text-xl px-4">
          Perubahanmu sudah tersimpan dan akan segera terlihat.
        </Text>
      </View>

      <View
        className="px-5 pt-4 gap-3"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <Button onPress={onViewProduct} style={{ width: '100%' }}>
          Lihat Produk
        </Button>
        <Button variant="outline" onPress={onBackToHome} style={{ width: '100%' }}>
          Kembali ke Beranda
        </Button>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/edit/components/EditSuccessScreen.tsx
git commit -m "feat(mobile): add EditSuccessScreen"
```

---

## Task 9: Mobile — Edit wizard routes

**Files:**
- Create: `apps/mobile/app/(protected)/edit/[id]/_layout.tsx`
- Create: `apps/mobile/app/(protected)/edit/[id]/foto.tsx`
- Create: `apps/mobile/app/(protected)/edit/[id]/kategori.tsx`
- Create: `apps/mobile/app/(protected)/edit/[id]/info.tsx`
- Create: `apps/mobile/app/(protected)/edit/[id]/review.tsx`
- Create: `apps/mobile/app/(protected)/edit/[id]/success.tsx`

- [ ] **Step 1: Create `_layout.tsx`**

```typescript
import { Stack, useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { View, TouchableOpacity, Alert, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { EditFormProvider, useEditFormContext } from '@/features/edit/context/EditFormContext';
import { StepIndicator } from '@/features/sell/components/StepIndicator';
import { useProduct } from '@/features/product/hooks/useProduct';
import { useAuth } from '@/context/AuthContext';
import type { WizardStep } from '@/features/sell/types';

const routeToStep: Record<string, WizardStep> = {
  foto: 1,
  kategori: 2,
  info: 3,
  review: 4,
};

function EditLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { hasChanges } = useEditFormContext();

  const currentRoute = pathname.split('/').pop() || 'foto';
  const currentStep = routeToStep[currentRoute] ?? 1;
  const isSuccessScreen = currentRoute === 'success';

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Batalkan Perubahan?',
        'Yakin ingin membatalkan? Perubahan yang sudah dibuat akan hilang.',
        [
          { text: 'Tidak', style: 'cancel' },
          { text: 'Ya, batalkan', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: isSuccessScreen ? 0 : insets.top }}>
      {isSuccessScreen && <StatusBar barStyle="dark-content" backgroundColor="#F9F906" />}

      {!isSuccessScreen && (
        <View className="relative">
          <StepIndicator
            currentStep={currentStep}
            stepLabels={['Foto', 'Kategori', 'Info', 'Review']}
          />
          <TouchableOpacity
            onPress={handleClose}
            className="absolute right-4 top-3 z-10"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      )}

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

export default function EditLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Memuat...</Text>
      </View>
    );
  }

  if (!product || !user || product.seller.id !== user.id) {
    router.replace(`/product/${id}` as any);
    return null;
  }

  return (
    <EditFormProvider product={product}>
      <EditLayoutContent />
    </EditFormProvider>
  );
}
```

- [ ] **Step 2: Create `foto.tsx`**

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EditPhotoUploadStep } from '@/features/edit/components/EditPhotoUploadStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';

export default function EditFotoStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, updateFormData } = useEditFormContext();

  return (
    <EditPhotoUploadStep
      photos={formData.photos}
      onPhotosChange={photos => updateFormData({ photos })}
      onNext={() => router.push(`/edit/${id}/kategori` as any)}
    />
  );
}
```

- [ ] **Step 3: Create `kategori.tsx`**

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CategoryStep } from '@/features/sell/components/CategoryStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';

export default function EditKategoriStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, updateFormData } = useEditFormContext();

  return (
    <CategoryStep
      selectedCategory={formData.category}
      selectedSubcategory={formData.subcategory}
      onCategorySelect={category => updateFormData({ category, subcategory: '', attributes: {} })}
      onSubcategorySelect={subcategory => updateFormData({ subcategory })}
      onNext={() => router.push(`/edit/${id}/info` as any)}
      onBack={() => router.back()}
    />
  );
}
```

- [ ] **Step 4: Create `info.tsx`**

`ProductInfoStep` expects `formData: SellFormData` (with `photos: string[]`). We construct a compatible object — `ProductInfoStep` never reads or modifies photos, so we pass `[]`.

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProductInfoStep } from '@/features/sell/components/ProductInfoStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';
import type { SellFormData } from '@/features/sell/types';

export default function EditInfoStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, updateFormData } = useEditFormContext();

  const sellFormData: SellFormData = {
    photos: [],
    category: formData.category,
    subcategory: formData.subcategory,
    attributes: formData.attributes,
    name: formData.name,
    price: formData.price,
    description: formData.description,
    location: formData.location,
  };

  return (
    <ProductInfoStep
      formData={sellFormData}
      onFormChange={(updates) => {
        const { photos: _photos, ...rest } = updates;
        updateFormData(rest);
      }}
      onNext={() => router.push(`/edit/${id}/review` as any)}
      onBack={() => router.back()}
    />
  );
}
```

- [ ] **Step 5: Create `review.tsx`**

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ReviewStep } from '@/features/sell/components/ReviewStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';
import { useAuth } from '@/context/AuthContext';
import { updateProduct } from '@/lib/api';

export default function EditReviewStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, isSubmitting, setSubmitting } = useEditFormContext();
  const { token } = useAuth();

  // ReviewStep expects SellFormData (photos: string[]). Construct it explicitly.
  const formDataForReview: import('@/features/sell/types').SellFormData = {
    photos: formData.photos.map(p => (p.kind === 'existing' ? p.url : p.uri)),
    category: formData.category,
    subcategory: formData.subcategory,
    attributes: formData.attributes,
    name: formData.name,
    price: formData.price,
    description: formData.description,
    location: formData.location,
  };

  const handleSave = async () => {
    if (!token || !formData.location) return;
    setSubmitting(true);
    try {
      await updateProduct(token, formData.productId, formData.photos, {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category: formData.category as string,
        subcategory: formData.subcategory as string,
        attributes: formData.attributes,
        location: formData.location,
        listingStatus: 'active',
      });
      router.replace(`/edit/${id}/success` as any);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReviewStep
      formData={formDataForReview}
      isSubmitting={isSubmitting}
      onEditPhotos={() => router.push(`/edit/${id}/foto` as any)}
      onEditInfo={() => router.push(`/edit/${id}/info` as any)}
      onPublish={handleSave}
      onBack={() => router.back()}
    />
  );
}
```

- [ ] **Step 6: Create `success.tsx`**

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EditSuccessScreen } from '@/features/edit/components/EditSuccessScreen';

export default function EditSuccessRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <EditSuccessScreen
      productId={id}
      onViewProduct={() => router.replace(`/product/${id}` as any)}
      onBackToHome={() => router.replace('/(tabs)' as any)}
    />
  );
}
```

- [ ] **Step 7: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/app/(protected)/edit/
git commit -m "feat(mobile): add edit product wizard routes"
```

---

## Task 10: Mobile — Edit button in ProductDetailScreen

**Files:**
- Modify: `apps/mobile/features/product/ProductDetailScreen.tsx`

- [ ] **Step 1: Add edit button logic**

In `features/product/ProductDetailScreen.tsx`, the `useAuth` import is already present. Inside the `ProductDetailScreen` component, after the existing constants add:

```typescript
const isOwner = !!user && product.seller.id === user.id;
```

Replace the header action icons section (the `<View className="flex-row gap-2">` block containing Share and Bookmark) with:

```tsx
<View className="flex-row gap-2">
  <TouchableOpacity onPress={() => {}} className="p-1">
    <Share size={22} color="#0A0A0A" />
  </TouchableOpacity>
  {isOwner ? (
    <TouchableOpacity
      onPress={() => router.push(`/edit/${id}/foto` as any)}
      className="p-1"
    >
      <PenNewSquare size={22} color="#0A0A0A" />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={handleSaveToggle}
      disabled={isSaving || isUnsaving}
      className="p-1"
    >
      {isSaved ? (
        <BookmarkBold size={22} color="#155DFC" />
      ) : (
        <Bookmark size={22} color="#0A0A0A" />
      )}
    </TouchableOpacity>
  )}
</View>
```

Add `PenNewSquare` to the icon import at the top:

```typescript
import {
  ArrowLeft,
  Share,
  Bookmark,
  Phone,
  PenNewSquare,
} from '@solar-icons/react-native/Linear';
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/product/ProductDetailScreen.tsx
git commit -m "feat(mobile): add edit button to ProductDetailScreen for product owner"
```

---

## Done

After all 10 tasks are complete, the full edit product flow is live:
1. Owner taps pencil icon on their product → wizard opens pre-filled
2. 4-step wizard: Foto → Kategori → Info → Review
3. Review taps "Simpan Perubahan" → PATCH sent to backend → success screen
4. Success screen: "Lihat Produk" or "Kembali ke Beranda"
