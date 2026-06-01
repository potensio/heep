# Saved Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to save/bookmark products they're interested in, with persistence to the database.

**Architecture:**
- Backend: New `saved_products` join table with REST endpoints for save/unsave/list operations
- Mobile: TanStack Query hooks following the existing migration pattern (hooks + queryKeys)

**Tech Stack:**
- Backend: Hono, Drizzle ORM, PostgreSQL
- Mobile: React Native, Expo, TanStack Query

---

## Files Modified/Created

**Backend:**
- `apps/backend/src/core/db/schema.ts` — Add `savedProducts` table
- `apps/backend/src/modules/saved-products/saved-products.repository.ts` — DB operations
- `apps/backend/src/modules/saved-products/saved-products.service.ts` — Business logic
- `apps/backend/src/modules/saved-products/saved-products.routes.ts` — HTTP endpoints
- `apps/backend/src/modules/saved-products/*.test.ts` — Tests
- `apps/backend/src/app.ts` — Register routes

**Mobile:**
- `apps/mobile/lib/queryKeys.ts` — Add saved products query keys
- `apps/mobile/lib/api.ts` — API functions for save/unsave/list
- `apps/mobile/features/saved/hooks/useSavedProducts.ts` — TanStack Query hook
- `apps/mobile/features/saved/hooks/useSaveProduct.ts` — Mutation hook
- `apps/mobile/features/product/ProductDetail.tsx` — Save button UI
- `apps/mobile/features/product/ProductDetailScreen.tsx` — Wire save functionality
- `apps/mobile/features/product/hooks/useIsSaved.ts` — Query hook for single product
- `apps/mobile/features/settings/SettingsScreen.tsx` — Replace security with saved
- `apps/mobile/features/saved/SavedProductsScreen.tsx` — Saved products list
- `apps/mobile/app/(protected)/settings/saved.tsx` — Route wrapper

**Removed:**
- `apps/mobile/features/settings/components/SecuritySettings.tsx`
- `apps/mobile/app/(protected)/settings/keamanan.tsx`

---

## Task 1: Backend — Database Schema

**Files:**
- Modify: `apps/backend/src/core/db/schema.ts`

- [ ] **Step 1: Add savedProducts table to schema**

Add to `apps/backend/src/core/db/schema.ts` after the `messages` table definition:

```typescript
export const savedProducts = pgTable('saved_products', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('saved_products_user_id_idx').on(t.userId),
  index('saved_products_product_id_idx').on(t.productId),
]);

export const savedProductsRelations = relations(savedProducts, ({ one }) => ({
  user: one(users, { fields: [savedProducts.userId], references: [users.id] }),
  product: one(products, { fields: [savedProducts.productId], references: [products.id] }),
}));
```

- [ ] **Step 2: Generate and run migration**

Run:
```bash
cd apps/backend && npm run db:generate && npm run db:migrate
```

Expected: Migration file created and applied successfully

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/core/db/schema.ts apps/backend/src/core/db/migrations/
git commit -m "feat(db): add saved_products table"
```

---

## Task 2: Backend — Repository Layer

**Files:**
- Create: `apps/backend/src/modules/saved-products/saved-products.repository.ts`
- Create: `apps/backend/src/modules/saved-products/saved-products.repository.test.ts`

- [ ] **Step 1: Write the failing repository test**

Create `apps/backend/src/modules/saved-products/saved-products.repository.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../core/db/client';
import { users, products, productImages, savedProducts } from '../../core/db/schema';
import { savedProductsRepository } from './saved-products.repository';

describe('savedProductsRepository', () => {
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    await db.delete(savedProducts);
    await db.delete(productImages);
    await db.delete(products);
    await db.delete(users);

    const [user] = await db.insert(users).values({ email: 'test@example.com' }).returning();
    userId = user.id;

    const [product] = await db.insert(products).values({
      sellerId: userId,
      name: 'Test Product',
      price: 100000,
      description: 'Test description',
      category: 'fashion',
      subcategory: 'kaos',
      listingStatus: 'active',
      approvalStatus: 'approved',
    }).returning();
    productId = product.id;

    await db.insert(productImages).values({
      productId,
      url: 'https://example.com/image.jpg',
      position: 0,
    });
  });

  describe('save', () => {
    it('creates a saved product record', async () => {
      const result = await savedProductsRepository.save(userId, productId);
      expect(result.userId).toBe(userId);
      expect(result.productId).toBe(productId);
    });

    it('throws on duplicate save', async () => {
      await savedProductsRepository.save(userId, productId);
      await expect(savedProductsRepository.save(userId, productId)).rejects.toThrow();
    });
  });

  describe('unsave', () => {
    it('removes a saved product record', async () => {
      await savedProductsRepository.save(userId, productId);
      await savedProductsRepository.unsave(userId, productId);
      const saved = await savedProductsRepository.isSaved(userId, productId);
      expect(saved).toBe(false);
    });
  });

  describe('isSaved', () => {
    it('returns true when saved', async () => {
      await savedProductsRepository.save(userId, productId);
      expect(await savedProductsRepository.isSaved(userId, productId)).toBe(true);
    });

    it('returns false when not saved', async () => {
      expect(await savedProductsRepository.isSaved(userId, productId)).toBe(false);
    });
  });

  describe('listByUser', () => {
    it('returns saved products ordered by savedAt desc', async () => {
      await savedProductsRepository.save(userId, productId);

      const [product2] = await db.insert(products).values({
        sellerId: userId,
        name: 'Second Product',
        price: 200000,
        description: 'Another product',
        category: 'fashion',
        subcategory: 'kemeja',
        listingStatus: 'active',
        approvalStatus: 'approved',
      }).returning();

      await db.insert(productImages).values({
        productId: product2.id,
        url: 'https://example.com/image2.jpg',
        position: 0,
      });

      await new Promise(r => setTimeout(r, 10));
      await savedProductsRepository.save(userId, product2.id);

      const result = await savedProductsRepository.listByUser(userId);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Second Product');
      expect(result.nextCursor).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/backend && npm test -- saved-products.repository.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write the repository implementation**

Create `apps/backend/src/modules/saved-products/saved-products.repository.ts`:

```typescript
import { and, desc, eq, lt, inArray, sql } from 'drizzle-orm';
import { db } from '../../core/db/client';
import { savedProducts, products, productImages, users } from '../../core/db/schema';

export interface SavedProductRow {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: Date;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  firstImageUrl: string | null;
  savedAt: Date;
}

type ListCursor = { savedAt: string; id: string };

function encodeCursor(c: ListCursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string): ListCursor | null {
  try {
    const c = JSON.parse(Buffer.from(s, 'base64url').toString());
    if (typeof c?.savedAt !== 'string') return null;
    return c as ListCursor;
  } catch {
    return null;
  }
}

export interface SavedProductsRepository {
  save(userId: string, productId: string): Promise<{ userId: string; productId: string; createdAt: Date }>;
  unsave(userId: string, productId: string): Promise<void>;
  isSaved(userId: string, productId: string): Promise<boolean>;
  listByUser(userId: string, cursor?: string, limit?: number): Promise<{ items: SavedProductRow[]; nextCursor: string | null }>;
}

export const savedProductsRepository: SavedProductsRepository = {
  async save(userId, productId) {
    const [row] = await db.insert(savedProducts).values({ userId, productId }).returning();
    return { userId: row.userId, productId: row.productId, createdAt: row.createdAt };
  },

  async unsave(userId, productId) {
    await db.delete(savedProducts).where(and(eq(savedProducts.userId, userId), eq(savedProducts.productId, productId)));
  },

  async isSaved(userId, productId) {
    const [row] = await db
      .select({ id: savedProducts.productId })
      .from(savedProducts)
      .where(and(eq(savedProducts.userId, userId), eq(savedProducts.productId, productId)))
      .limit(1);
    return !!row;
  },

  async listByUser(userId, cursor, limit = 20) {
    const actualLimit = Math.min(limit, 50);
    const where = [eq(savedProducts.userId, userId)];

    if (cursor) {
      const c = decodeCursor(cursor);
      if (c) where.push(lt(savedProducts.createdAt, new Date(c.savedAt)));
    }

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        category: products.category,
        subcategory: products.subcategory,
        locationName: products.locationName,
        locationLat: products.locationLat,
        locationLng: products.locationLng,
        createdAt: products.createdAt,
        sellerId: users.id,
        sellerName: users.name,
        sellerAvatarUrl: users.avatarUrl,
        savedAt: savedProducts.createdAt,
      })
      .from(savedProducts)
      .innerJoin(products, eq(savedProducts.productId, products.id))
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(and(...where))
      .orderBy(desc(savedProducts.createdAt))
      .limit(actualLimit + 1);

    const hasMore = rows.length > actualLimit;
    const slice = hasMore ? rows.slice(0, actualLimit) : rows;

    if (slice.length === 0) return { items: [], nextCursor: null };

    const ids = slice.map(r => r.id);
    const imageRows = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(and(inArray(productImages.productId, ids), eq(productImages.position, 0)));

    const imageMap = new Map(imageRows.map(i => [i.productId, i.url]));
    const last = slice[slice.length - 1];
    const nextCursor = hasMore ? encodeCursor({ savedAt: last.savedAt.toISOString(), id: last.id }) : null;

    return {
      items: slice.map(r => ({
        id: r.id,
        name: r.name,
        price: r.price,
        category: r.category,
        subcategory: r.subcategory,
        locationName: r.locationName,
        locationLat: r.locationLat,
        locationLng: r.locationLng,
        createdAt: r.createdAt,
        seller: { id: r.sellerId, name: r.sellerName, avatarUrl: r.sellerAvatarUrl },
        firstImageUrl: imageMap.get(r.id) ?? null,
        savedAt: r.savedAt,
      })),
      nextCursor,
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd apps/backend && npm test -- saved-products.repository.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/saved-products/
git commit -m "feat(backend): add saved products repository"
```

---

## Task 3: Backend — Service Layer

**Files:**
- Create: `apps/backend/src/modules/saved-products/saved-products.service.ts`
- Create: `apps/backend/src/modules/saved-products/saved-products.service.test.ts`

- [ ] **Step 1: Write the failing service test**

Create `apps/backend/src/modules/saved-products/saved-products.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { savedProductsService } from './saved-products.service';
import { savedProductsRepository } from './saved-products.repository';

vi.mock('./saved-products.repository');

describe('savedProductsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('saveProduct', () => {
    it('calls repository save', async () => {
      vi.mocked(savedProductsRepository.save).mockResolvedValueOnce({
        userId: 'user-1', productId: 'product-1', createdAt: new Date(),
      });
      const result = await savedProductsService.saveProduct('user-1', 'product-1');
      expect(savedProductsRepository.save).toHaveBeenCalledWith('user-1', 'product-1');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('unsaveProduct', () => {
    it('calls repository unsave', async () => {
      vi.mocked(savedProductsRepository.unsave).mockResolvedValueOnce();
      await savedProductsService.unsaveProduct('user-1', 'product-1');
      expect(savedProductsRepository.unsave).toHaveBeenCalledWith('user-1', 'product-1');
    });
  });

  describe('isSaved', () => {
    it('delegates to repository', async () => {
      vi.mocked(savedProductsRepository.isSaved).mockResolvedValueOnce(true);
      expect(await savedProductsService.isSaved('user-1', 'product-1')).toBe(true);
    });
  });

  describe('listSavedProducts', () => {
    it('maps repository result to API response', async () => {
      vi.mocked(savedProductsRepository.listByUser).mockResolvedValueOnce({
        items: [{
          id: 'product-1', name: 'Test', price: 100000, category: 'fashion', subcategory: 'kaos',
          locationName: 'Jakarta', locationLat: -6.2, locationLng: 106.8,
          createdAt: new Date('2024-01-01'),
          seller: { id: 's1', name: 'Seller', avatarUrl: null },
          firstImageUrl: 'https://example.com/img.jpg',
          savedAt: new Date('2024-01-02'),
        }],
        nextCursor: null,
      });
      const result = await savedProductsService.listSavedProducts('user-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].photos[0].url).toBe('https://example.com/img.jpg');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/backend && npm test -- saved-products.service.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write the service implementation**

Create `apps/backend/src/modules/saved-products/saved-products.service.ts`:

```typescript
import { savedProductsRepository, type SavedProductRow } from './saved-products.repository';

export interface SavedProductItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
  savedAt: string;
}

export interface SavedProductsListResult {
  items: SavedProductItem[];
  nextCursor: string | null;
}

function mapToApi(row: SavedProductRow): SavedProductItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    photos: row.firstImageUrl ? [{ url: row.firstImageUrl, position: 0 }] : [],
    category: row.category,
    subcategory: row.subcategory,
    location: row.locationName ? { name: row.locationName, lat: row.locationLat!, lng: row.locationLng! } : null,
    seller: row.seller,
    createdAt: row.createdAt.toISOString(),
    savedAt: row.savedAt.toISOString(),
  };
}

export const savedProductsService = {
  async saveProduct(userId: string, productId: string) {
    return savedProductsRepository.save(userId, productId);
  },

  async unsaveProduct(userId: string, productId: string) {
    await savedProductsRepository.unsave(userId, productId);
  },

  async isSaved(userId: string, productId: string) {
    return savedProductsRepository.isSaved(userId, productId);
  },

  async listSavedProducts(userId: string, cursor?: string, limit?: number): Promise<SavedProductsListResult> {
    const { items, nextCursor } = await savedProductsRepository.listByUser(userId, cursor, limit);
    return { items: items.map(mapToApi), nextCursor };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd apps/backend && npm test -- saved-products.service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/saved-products/
git commit -m "feat(backend): add saved products service"
```

---

## Task 4: Backend — Routes

**Files:**
- Create: `{}apps/backend/src/modules/saved-products/saved-products.routes.ts`
- Create: `apps/backend/src/modules/saved-products/saved-products.routes.test.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Write the failing routes test**

Create `apps/backend/src/modules/saved-products/saved-products.routes.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../app';
import { db } from '../../core/db/client';
import { users, products, productImages, savedProducts } from '../../core/db/schema';

describe('saved-products routes', () => {
  let token: string;
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    await db.delete(savedProducts);
    await db.delete(productImages);
    await db.delete(products);
    await db.delete(users);

    const [user] = await db.insert(users).values({ email: 'test@example.com' }).returning();
    userId = user.id;

    const otpRes = await app.request('/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const otp = (await otpRes.json()).code;

    const verifyRes = await app.request('/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', code: otp }),
    });
    token = (await verifyRes.json()).accessToken;

    const [product] = await db.insert(products).values({
      sellerId: userId,
      name: 'Test Product',
      price: 100000,
      description: 'desc',
      category: 'fashion',
      subcategory: 'kaos',
      listingStatus: 'active',
      approvalStatus: 'approved',
    }).returning();
    productId = product.id;

    await db.insert(productImages).values({ productId, url: 'https://example.com/img.jpg', position: 0 });
  });

  describe('POST /saved-products/:productId', () => {
    it('saves a product', async () => {
      const res = await app.request(`/saved-products/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.productId).toBe(productId);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await app.request(`/saved-products/${productId}`, { method: 'POST' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /saved-products/:productId', () => {
    it('unsaves a product', async () => {
      await app.request(`/saved-products/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await app.request(`/saved-products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(204);
    });
  });

  describe('GET /saved-products', () => {
    it('lists saved products', async () => {
      await app.request(`/saved-products/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await app.request('/saved-products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].id).toBe(productId);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/backend && npm test -- saved-products.routes.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write the routes implementation**

Create `apps/backend/src/modules/saved-products/saved-products.routes.ts`:

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { savedProductsService } from './saved-products.service';

export const savedProductsRoutes = new Hono<{ Variables: AppVariables }>();

// All routes require authentication
savedProductsRoutes.use('*', requireAuth);

savedProductsRoutes.post('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  const result = await savedProductsService.saveProduct(userId, productId);
  return c.json(result, 201);
});

savedProductsRoutes.delete('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  await savedProductsService.unsaveProduct(userId, productId);
  return c.body(null, 204);
});

savedProductsRoutes.get('/', async (c) => {
  const userId = c.get('user').id;
  const cursor = c.req.query('cursor');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : undefined;
  const result = await savedProductsService.listSavedProducts(userId, cursor, limit);
  return c.json(result);
});
```

- [ ] **Step 4: Register routes in app.ts**

Modify `apps/backend/src/app.ts`:

```typescript
import { savedProductsRoutes } from './modules/saved-products/saved-products.routes';

// ...existing imports...

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/products', productsRoutes);
  app.route('/saved-products', savedProductsRoutes);  // ADD THIS LINE

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd apps/backend && npm test -- saved-products.routes.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/saved-products/ apps/backend/src/app.ts
git commit -m "feat(backend): add saved products routes"
```

---

## Task 5: Mobile — API Functions

**Files:**
- Modify: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Add saved products API functions**

Add to `apps/mobile/lib/api.ts`:

```typescript
// Add to existing file, after fetchSellerProducts

export async function saveProduct(token: string, productId: string): Promise<void> {
  const res = await fetch(`${BASE}/saved-products/${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
}

export async function unsaveProduct(token: string, productId: string): Promise<void> {
  const res = await fetch(`${BASE}/saved-products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
}

export interface SavedProductItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
  savedAt: string;
}

export async function fetchSavedProducts(
  token: string,
  cursor?: string,
  limit?: number,
): Promise<PaginatedItems<SavedProductItem>> {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', cursor);
  if (limit) qs.set('limit', String(limit));
  const q = qs.toString();

  const res = await fetch(`${BASE}/saved-products${q ? `?${q}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<PaginatedItems<SavedProductItem>>;
}

export async function checkIsSaved(token: string, productId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/saved-products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const data = await res.json() as PaginatedItems<SavedProductItem>;
  return data.items.some(item => item.id === productId);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/lib/api.ts
git commit -m "feat(mobile): add saved products API functions"
```

---

## Task 6: Mobile — Query Keys

**Files:**
- Modify: `apps/mobile/lib/queryKeys.ts`

- [ ] **Step 1: Add saved products query keys**

Add to `apps/mobile/lib/queryKeys.ts`:

```typescript
export const queryKeys = {
  // ...existing keys...
  savedProducts: () => ['savedProducts'] as const,
  isSaved: (productId: string) => ['isSaved', productId] as const,
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/lib/queryKeys.ts
git commit -m "feat(mobile): add saved products query keys"
```

---

## Task 7: Mobile — TanStack Query Hooks

**Files:**
- Create: `apps/mobile/features/saved/hooks/useSavedProducts.ts`
- Create: `apps/mobile/features/saved/hooks/useSaveProduct.ts`
- Create: `apps/mobile/features/product/hooks/useIsSaved.ts`

- [ ] **Step 1: Create useSavedProducts hook**

Create `apps/mobile/features/saved/hooks/useSavedProducts.ts`:

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchSavedProducts, type SavedProductItem } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Product } from '@/lib/types';

function normalize(item: SavedProductItem): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.photos[0]?.url ?? '',
    seller: item.seller.name ?? '',
    sellerId: item.seller.id,
    category: item.category,
    location: item.location ?? undefined,
  };
}

export function useSavedProducts() {
  const { token } = useAuth();

  const query = useInfiniteQuery({
    queryKey: queryKeys.savedProducts(),
    queryFn: ({ pageParam }) => fetchSavedProducts(token!, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
    initialPageParam: undefined as string | undefined,
  });

  const data = query.data?.pages.flatMap(page => page.items.map(normalize)) ?? [];

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    fetchMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 2: Create useSaveProduct mutation hook**

Create `apps/mobile/features/saved/hooks/useSaveProduct.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { saveProduct, unsaveProduct } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useSaveProduct(productId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => saveProduct(token!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedProducts() });
      queryClient.setQueryData(queryKeys.isSaved(productId), true);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsaveProduct(token!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedProducts() });
      queryClient.setQueryData(queryKeys.isSaved(productId), false);
    },
  });

  return {
    save: saveMutation.mutateAsync,
    unsave: unsaveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isUnsaving: unsaveMutation.isPending,
  };
}
```

- [ ] **Step 3: Create useIsSaved hook**

Create `apps/mobile/features/product/hooks/useIsSaved.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { checkIsSaved } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useIsSaved(productId: string) {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.isSaved(productId),
    queryFn: () => checkIsSaved(token!, productId),
    enabled: !!token && isAuthenticated,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/saved/hooks/ apps/mobile/features/product/hooks/useIsSaved.ts
git commit -m "feat(mobile): add TanStack Query hooks for saved products"
```

---

## Task 8: Mobile — ProductDetail Save Button

**Files:**
- Modify: `apps/mobile/features/product/ProductDetail.tsx`
- Modify: `apps/mobile/features/product/ProductDetailScreen.tsx`

- [ ] **Step 1: Add save button to ProductDetail component**

Modify `apps/mobile/features/product/ProductDetail.tsx` - update props and add heart button:

```typescript
import { Heart, Share, CloseCircle } from "@solar-icons/react-native/Linear";
import { HeartBold } from "@solar-icons/react-native/Bold";

// Add to ProductDetailProps interface:
interface ProductDetailProps {
  product: ProductDetailData;
  showSeller?: boolean;
  onSellerPress?: () => void;
  footerContent?: React.ReactNode;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  isSaving?: boolean;
}

// Add header with save button at the top of the component return:
export function ProductDetail({
  product,
  showSeller = true,
  onSellerPress,
  footerContent,
  isSaved = false,
  onSaveToggle,
  isSaving = false,
}: ProductDetailProps) {
  // ...existing state...

  return (
    <View className="flex-1 bg-background">
      {/* Header with save button */}
      <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 py-3">
        <View className="w-10" />
        <TouchableOpacity
          onPress={onSaveToggle}
          disabled={isSaving}
          className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
        >
          {isSaved ? (
            <HeartBold size={22} color="#FB2C36" />
          ) : (
            <Heart size={22} color="#374151" />
          )}
        </TouchableOpacity>
      </View>

      {/* Rest of the component unchanged... */}
    </View>
  );
}
```

- [ ] **Step 2: Wire up ProductDetailScreen**

Modify `apps/mobile/features/product/ProductDetailScreen.tsx`:

```typescript
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ProductDetail } from "./ProductDetail";
import { useProduct } from "./hooks/useProduct";
import { useIsSaved } from "./hooks/useIsSaved";
import { useSaveProduct } from "@/features/saved/hooks/useSaveProduct";

export function ProductDetailScreen({ id }: ProductDetailScreenProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const { data: product, isLoading, error } = useProduct(id);
  const { data: isSaved = false } = useIsSaved(id);
  const { save, unsave, isSaving, isUnsaving } = useSaveProduct(id);

  // ...existing early returns...

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      router.push({ pathname: '/auth' as any, params: { returnTo: `/product/${id}` } });
      return;
    }
    if (isSaved) {
      await unsave();
    } else {
      await save();
    }
  };

  // ...existing footerContent...

  return (
    <ProductDetail
      product={productData}
      onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
      footerContent={footerContent}
      isSaved={isSaved}
      onSaveToggle={handleSaveToggle}
      isSaving={isSaving || isUnsaving}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/product/ProductDetail.tsx apps/mobile/features/product/ProductDetailScreen.tsx
git commit -m "feat(mobile): add save button to product detail"
```

---

## Task 9: Mobile — SavedProductsScreen

**Files:**
- Create: `apps/mobile/features/saved/SavedProductsScreen.tsx`

- [ ] **Step 1: Create SavedProductsScreen**

Create `apps/mobile/features/saved/SavedProductsScreen.tsx`:

```typescript
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSavedProducts } from "./hooks/useSavedProducts";
import { ProductCard } from "@/features/search/components/ProductCard";

export function SavedProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, error, fetchMore, hasMore, refetch } = useSavedProducts();

  if (isLoading) {
    return (
      <View className="flex-1{}
 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#155DFC" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-gray-500 text-center">Gagal memuat produk disimpan.</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-gray-500 text-center">Belum ada produk disimpan.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="px-4 justify-between"
        contentContainerStyle={{ paddingTop: insets.top > 0 ? insets.top : 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/product/${item.id}`)}
            onSellerPress={() => router.push(`/user/${item.sellerId}`)}
            width="48%"
            marginRight={0}
          />
        )}
        onEndReached={() => hasMore && fetchMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore ? <ActivityIndicator size="small" color="#155DFC" /> : null}
      />
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/saved/SavedProductsScreen.tsx
git commit -m "feat(mobile): add SavedProductsScreen"
```

---

## Task 10: Mobile — Settings Screen Update

**Files:**
- Modify: `apps/mobile/features/settings/SettingsScreen.tsx`
- Delete: `apps/mobile/features/settings/components/SecuritySettings.tsx`
- Delete: `apps/mobile/app/(protected)/settings/keamanan.tsx`
- Modify: `apps/mobile/app/(tabs)/akun.tsx`
- Create: `apps/mobile/app/(protected)/settings/saved.tsx`

- [ ] **Step 1: Update SettingsScreen**

Modify `apps/mobile/features/settings/SettingsScreen.tsx`:

```typescript
import { Bookmark } from "@solar-icons/react-native/Linear";

interface SettingsScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToPhone: () => void;
  onNavigateToSaved: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

export function SettingsScreen({
  onNavigateToProfile,
  onNavigateToPhone,
  onNavigateToSaved,
  onNavigateToNotifications,
  onLogout,
}: SettingsScreenProps) {
  // ...existing code...
  
  // Replace Security item with Saved:
  <SettingsItem
    icon={<Bookmark size={20} className="text-gray-700" />}
    label="Produk Disimpan"
    onPress={onNavigateToSaved}
  />
}
```

- [ ] **Step 2: Create saved route**

Create `apps/mobile/app/(protected)/settings/saved.tsx`:

```typescript
import { SavedProductsScreen } from "@/features/saved/SavedProductsScreen";

export default function SavedScreen() {
  return <SavedProductsScreen />;
}
```

- [ ] **Step 3: Update akun.tsx**

Modify `apps/mobile/app/(tabs)/akun.tsx`:

```typescript
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function AccountTab() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SettingsScreen
      onNavigateToProfile={() => router.push('/(protected)/settings/profil')}
      onNavigateToPhone={() => router.push('/(protected)/settings/handphone')}
      onNavigateToSaved={() => router.push('/(protected)/settings/saved')}
      onNavigateToNotifications={() => router.push('/(protected)/settings/notifikasi')}
      onLogout={() => {
        logout();
        router.replace('/auth');
      }}
    />
  );
}
```

- [ ] **Step 4: Delete security files**

```bash
rm apps/mobile/features/settings/components/SecuritySettings.tsx
rm apps/mobile/app/\(protected\)/settings/keamanan.tsx
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(mobile): add saved products to settings, remove security"
```

---

## Task 11: Mobile — Normalize Function (Optional Cleanup)

**Files:**
- Create: `apps/mobile/lib/normalize.ts`

This follows the TanStack Query migration spec — shared normalize function for products.

- [ ] **Step 1: Create shared normalize function (optional enhancement)**

Create `apps/mobile/lib/normalize.ts` following the pattern in the TanStack migration spec. This is optional and can be deferred to avoid scope creep.

- [ ] **Step 2: Skip for now**

This is noted but out of scope for this feature. The normalize functions in the hooks are sufficient.

---

## Verification

After completing all tasks:

1. **Backend tests pass:**
```bash
cd apps/backend && npm test
```

2. **Mobile type checks:**
```bash
cd apps/mobile && npx tsc --noEmit
```

3. **Manual testing:**
   - Save a product from product detail → heart fills
   - Go to Settings → Produk Disimpan → see saved product
   - Unsave from list → product disappears
   - Unauthenticated user taps heart → redirected to login
