# Product Read API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add product read endpoints to the backend (feed, search, detail, seller profile) and wire the four mobile screens that currently use hardcoded mock data to the real API.

**Architecture:** Backend follows the existing `validation → routes → service → repository` pattern. Four new GET endpoints on `/products` and one on `/users/:id/products`. Mobile adds thin fetch helpers to `lib/api.ts`, one hook per screen, and swaps mock data imports for hook calls.

**Tech Stack:** Backend — Hono, Drizzle ORM (PostgreSQL), Zod, Vitest. Mobile — React Native, Expo Router, TypeScript (no test suite; validate with `npx tsc --noEmit`).

---

## File Map

**Backend — modified:**
- `apps/backend/src/modules/products/products.repository.ts` — add `list()`, `findById()`, `countForSeller()`; widen `approvalStatus` type
- `apps/backend/src/modules/products/products.repository.test.ts` — add tests for new methods
- `apps/backend/src/modules/products/products.validation.ts` — add `feedQuerySchema`, `searchQuerySchema`
- `apps/backend/src/modules/products/products.service.ts` — add `listFeed()`, `searchProducts()`, `getProduct()`
- `apps/backend/src/modules/products/products.service.test.ts` — add tests for new methods
- `apps/backend/src/modules/products/products.routes.ts` — add `GET /feed`, `GET /search`, `GET /:id`
- `apps/backend/src/modules/products/products.routes.test.ts` — add route tests
- `apps/backend/src/modules/users/users.service.ts` — extend `PublicUser`, inject `countActiveListings` dep, extend `getById()`
- `apps/backend/src/modules/users/users.service.test.ts` — update call sites, add test for extended `getById()`
- `apps/backend/src/modules/users/users.validation.ts` — add `sellerProductsQuerySchema`
- `apps/backend/src/modules/users/users.routes.ts` — add `GET /:id/products`
- `apps/backend/src/modules/users/users.routes.test.ts` — add tests for new/extended routes

**Mobile — modified:**
- `apps/mobile/lib/api.ts` — add `get<T>()` helper and five fetch functions; add types

**Mobile — created:**
- `apps/mobile/features/home/hooks/useProductFeed.ts`
- `apps/mobile/features/search/hooks/useProductSearch.ts`
- `apps/mobile/features/product/hooks/useProduct.ts`
- `apps/mobile/features/seller/hooks/useSeller.ts`
- `apps/mobile/features/seller/hooks/useSellerProducts.ts`

**Mobile — modified (wiring):**
- `apps/mobile/features/home/HomeScreen.tsx`
- `apps/mobile/features/search/SearchProductsScreen.tsx`
- `apps/mobile/features/product/ProductDetailScreen.tsx`
- `apps/mobile/features/seller/SellerProfileScreen.tsx`

---

## Task 1 — products.repository.ts: add `list()`, `findById()`, `countForSeller()`

**Files:**
- Modify: `apps/backend/src/modules/products/products.repository.ts`
- Modify: `apps/backend/src/modules/products/products.repository.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `apps/backend/src/modules/products/products.repository.test.ts`:

```ts
import { db } from '../../core/db/client';
import { products as productsTable } from '../../core/db/schema';
import { eq } from 'drizzle-orm';

// Helper: create a product then flip it to active + approved directly in the DB.
async function createApproved(sellerId: string, overrides: Partial<typeof baseInput> = {}) {
  const { product } = await productsRepository.create({ sellerId, ...baseInput, ...overrides });
  await db
    .update(productsTable)
    .set({ listingStatus: 'active', approvalStatus: 'approved' })
    .where(eq(productsTable.id, product.id));
  return product;
}

describe('productsRepository.list', () => {
  it('returns empty when no approved active products exist', async () => {
    const user = await usersRepository.create({ email: 'list-empty@example.com' });
    await productsRepository.create({ sellerId: user.id, ...baseInput }); // pending, not returned
    const result = await productsRepository.list({});
    expect(result.rows).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it('returns active+approved products with seller and image', async () => {
    const user = await usersRepository.create({ email: 'list-ok@example.com' });
    const product = await createApproved(user.id);
    const result = await productsRepository.list({});
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(product.id);
    expect(result.rows[0].seller.id).toBe(user.id);
    expect(result.rows[0].firstImageUrl).toBe(
      'https://cdn.test.example.com/products/uploads/test-0.jpg',
    );
  });

  it('paginates: returns nextCursor when there are more results', async () => {
    const user = await usersRepository.create({ email: 'list-page@example.com' });
    await createApproved(user.id, { name: 'A' });
    await createApproved(user.id, { name: 'B' });
    await createApproved(user.id, { name: 'C' });

    const page1 = await productsRepository.list({ limit: 2 });
    expect(page1.rows).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await productsRepository.list({ limit: 2, cursor: page1.nextCursor! });
    expect(page2.rows).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();

    const allIds = [...page1.rows, ...page2.rows].map(r => r.id);
    expect(new Set(allIds).size).toBe(3);
  });

  it('filters by sellerId', async () => {
    const u1 = await usersRepository.create({ email: 'seller-a@example.com' });
    const u2 = await usersRepository.create({ email: 'seller-b@example.com' });
    await createApproved(u1.id, { name: 'A1' });
    await createApproved(u2.id, { name: 'B1' });
    const result = await productsRepository.list({ sellerId: u1.id });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].seller.id).toBe(u1.id);
  });

  it('filters by q (case-insensitive name match)', async () => {
    const user = await usersRepository.create({ email: 'list-q@example.com' });
    await createApproved(user.id, { name: 'Toyota Avanza 2020' });
    await createApproved(user.id, { name: 'Honda Jazz 2019' });
    const result = await productsRepository.list({ q: 'toyota' });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Toyota Avanza 2020');
  });

  it('sorts by price ascending (termurah)', async () => {
    const user = await usersRepository.create({ email: 'list-price@example.com' });
    await createApproved(user.id, { name: 'Expensive', price: 500_000_000 });
    await createApproved(user.id, { name: 'Cheap', price: 50_000_000 });
    const result = await productsRepository.list({ sortBy: 'termurah' });
    expect(result.rows[0].name).toBe('Cheap');
  });
});

describe('productsRepository.findById', () => {
  it('returns null for unknown id', async () => {
    expect(await productsRepository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('returns product with all photos and seller', async () => {
    const user = await usersRepository.create({ email: 'detail@example.com' });
    const { product } = await productsRepository.create({ sellerId: user.id, ...baseInput });
    const row = await productsRepository.findById(product.id);
    expect(row).not.toBeNull();
    expect(row!.id).toBe(product.id);
    expect(row!.seller.id).toBe(user.id);
    expect(row!.photos).toHaveLength(2);
    expect(row!.photos[0].position).toBe(0);
    expect(row!.photos[1].position).toBe(1);
    expect(row!.description).toBe('Kondisi baik');
    expect(row!.attributes).toMatchObject({ brand: 'Toyota' });
  });
});

describe('productsRepository.countForSeller', () => {
  it('returns 0 when seller has no active+approved listings', async () => {
    const user = await usersRepository.create({ email: 'count-zero@example.com' });
    await productsRepository.create({ sellerId: user.id, ...baseInput }); // pending
    expect(await productsRepository.countForSeller(user.id)).toBe(0);
  });

  it('counts only active+approved listings', async () => {
    const user = await usersRepository.create({ email: 'count-ok@example.com' });
    await createApproved(user.id);
    await createApproved(user.id);
    await productsRepository.create({ sellerId: user.id, ...baseInput }); // pending, not counted
    expect(await productsRepository.countForSeller(user.id)).toBe(2);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd apps/backend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|productsRepository.list|findById|countForSeller" | head -30
```

Expected: tests fail with `productsRepository.list is not a function` (or similar).

- [ ] **Step 3: Implement in `products.repository.ts`**

Replace the full file with:

```ts
import { and, asc, desc, eq, gt, gte, ilike, inArray, lt, lte, or, sql } from 'drizzle-orm';
import { db } from '../../core/db/client';
import { productImages, products, users } from '../../core/db/schema';

export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;

export interface CreateProductRepoInput {
  sellerId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subcategory: string;
  attributes: Record<string, string | number>;
  listingStatus: 'draft' | 'active';
  approvalStatus: 'pending' | 'approved';
  expiresAt: Date | null;
  locationName: string;
  locationPlaceId: string;
  locationLat: number;
  locationLng: number;
  photos: { url: string; position: number }[];
}

export interface ListFilters {
  cursor?: string;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'terbaru' | 'termurah' | 'termahal';
  q?: string;
  sellerId?: string;
}

export interface ProductListRow {
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
}

export interface ProductDetailRow {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subcategory: string;
  attributes: Record<string, string | number>;
  listingStatus: string;
  approvalStatus: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: Date;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  photos: { url: string; position: number }[];
}

// Opaque cursor: base64url-encoded JSON.
type DateCursor = { t: 'd'; v: string };
type PriceCursor = { t: 'p'; price: number; id: string };
type Cursor = DateCursor | PriceCursor;

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string): Cursor | null {
  try {
    return JSON.parse(Buffer.from(s, 'base64url').toString()) as Cursor;
  } catch {
    return null;
  }
}

export interface ProductsRepository {
  create(input: CreateProductRepoInput): Promise<{ product: Product; images: ProductImage[] }>;
  list(filters: ListFilters): Promise<{ rows: ProductListRow[]; nextCursor: string | null }>;
  findById(id: string): Promise<ProductDetailRow | null>;
  countForSeller(sellerId: string): Promise<number>;
}

export const productsRepository: ProductsRepository = {
  async create(input) {
    const { photos, ...productData } = input;
    return db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values(productData).returning();
      const images = await tx
        .insert(productImages)
        .values(photos.map(p => ({ productId: product.id, url: p.url, position: p.position })))
        .returning();
      return { product, images };
    });
  },

  async list(filters) {
    const limit = Math.min(filters.limit ?? 20, 50);
    const sortBy = filters.sortBy ?? 'terbaru';

    const where = [
      eq(products.listingStatus, 'active'),
      eq(products.approvalStatus, 'approved'),
    ];

    if (filters.sellerId) where.push(eq(products.sellerId, filters.sellerId));
    if (filters.category) where.push(eq(products.category, filters.category as never));
    if (filters.minPrice !== undefined) where.push(gte(products.price, filters.minPrice));
    if (filters.maxPrice !== undefined) where.push(lte(products.price, filters.maxPrice));
    if (filters.q) where.push(ilike(products.name, `%${filters.q}%`));

    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      if (cursor) {
        if (cursor.t === 'd') {
          where.push(lt(products.createdAt, new Date(cursor.v)));
        } else if (sortBy === 'termurah') {
          where.push(
            or(
              gt(products.price, cursor.price),
              and(eq(products.price, cursor.price), gt(products.id, cursor.id)),
            )!,
          );
        } else if (sortBy === 'termahal') {
          where.push(
            or(
              lt(products.price, cursor.price),
              and(eq(products.price, cursor.price), lt(products.id, cursor.id)),
            )!,
          );
        }
      }
    }

    const orderBy =
      sortBy === 'termurah'
        ? [asc(products.price), asc(products.id)]
        : sortBy === 'termahal'
          ? [desc(products.price), desc(products.id)]
          : [desc(products.createdAt)];

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
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(and(...where))
      .orderBy(...orderBy)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    if (slice.length === 0) return { rows: [], nextCursor: null };

    const ids = slice.map(r => r.id);
    const imageRows = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(and(inArray(productImages.productId, ids), eq(productImages.position, 0)));

    const imageMap = new Map(imageRows.map(i => [i.productId, i.url]));

    const last = slice[slice.length - 1];
    const nextCursor = hasMore
      ? sortBy === 'terbaru'
        ? encodeCursor({ t: 'd', v: last.createdAt.toISOString() })
        : encodeCursor({ t: 'p', price: last.price, id: last.id })
      : null;

    return {
      rows: slice.map(r => ({
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
      })),
      nextCursor,
    };
  },

  async findById(id) {
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

  async countForSeller(sellerId) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.sellerId, sellerId),
          eq(products.listingStatus, 'active'),
          eq(products.approvalStatus, 'approved'),
        ),
      );
    return row?.count ?? 0;
  },
};
```

- [ ] **Step 4: Run tests**

```bash
cd apps/backend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|✗|list|findById|countForSeller"
```

Expected: all new tests pass, existing create/rollback tests still pass.

- [ ] **Step 5: Commit**

```bash
cd apps/backend && git add src/modules/products/products.repository.ts src/modules/products/products.repository.test.ts && git commit -m "feat(products): add list(), findById(), countForSeller() to repository"
```

---

## Task 2 — products.validation.ts + products.service.ts: add read service methods

**Files:**
- Modify: `apps/backend/src/modules/products/products.validation.ts`
- Modify: `apps/backend/src/modules/products/products.service.ts`
- Modify: `apps/backend/src/modules/products/products.service.test.ts`

- [ ] **Step 1: Add failing service tests**

Append to `apps/backend/src/modules/products/products.service.test.ts`:

```ts
import type { ProductListRow, ProductDetailRow } from './products.repository';

const stubListRow: ProductListRow = {
  id: 'prod-1',
  name: 'Avanza',
  price: 150_000_000,
  category: 'kendaraan',
  subcategory: 'mobil',
  locationName: 'Jakarta',
  locationLat: -6.2,
  locationLng: 106.8,
  createdAt: new Date('2024-01-01'),
  seller: { id: 'seller-1', name: 'Andi', avatarUrl: null },
  firstImageUrl: 'https://cdn.example.com/img.jpg',
};

const stubDetailRow: ProductDetailRow = {
  ...stubListRow,
  description: 'Kondisi baik',
  attributes: { brand: 'Toyota' },
  listingStatus: 'active',
  approvalStatus: 'approved',
  photos: [{ url: 'https://cdn.example.com/img.jpg', position: 0 }],
};

function makeFakeRepoWithRead() {
  const base = makeFakeRepo();
  return {
    repo: {
      ...base.repo,
      async list(_filters: unknown) {
        return { rows: [stubListRow], nextCursor: null };
      },
      async findById(id: string) {
        return id === 'prod-1' ? stubDetailRow : null;
      },
      async countForSeller(_id: string) { return 0; },
    },
    getLastInput: base.getLastInput,
  };
}

describe('createProductsService — read methods', () => {
  it('listFeed maps ProductListRow to ProductListItem', async () => {
    const { repo } = makeFakeRepoWithRead();
    const svc = createProductsService({ repo, storage: fakeStorage });
    const result = await svc.listFeed({});
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('prod-1');
    expect(result.items[0].photos).toEqual([{ url: 'https://cdn.example.com/img.jpg', position: 0 }]);
    expect(result.items[0].location).toEqual({ name: 'Jakarta', lat: -6.2, lng: 106.8 });
    expect(result.nextCursor).toBeNull();
  });

  it('searchProducts passes q and sortBy through to repo', async () => {
    let capturedFilters: unknown = null;
    const { repo } = makeFakeRepoWithRead();
    const spyRepo = {
      ...repo,
      async list(filters: unknown) { capturedFilters = filters; return { rows: [], nextCursor: null }; },
    };
    const svc = createProductsService({ repo: spyRepo, storage: fakeStorage });
    await svc.searchProducts({ q: 'avanza', sortBy: 'termurah' });
    expect(capturedFilters).toMatchObject({ q: 'avanza', sortBy: 'termurah' });
  });

  it('getProduct returns ProductDetailItem', async () => {
    const { repo } = makeFakeRepoWithRead();
    const svc = createProductsService({ repo, storage: fakeStorage });
    const item = await svc.getProduct('prod-1');
    expect(item.id).toBe('prod-1');
    expect(item.description).toBe('Kondisi baik');
    expect(item.photos).toHaveLength(1);
  });

  it('getProduct throws NotFoundError for unknown id', async () => {
    const { repo } = makeFakeRepoWithRead();
    const svc = createProductsService({ repo, storage: fakeStorage });
    await expect(svc.getProduct('unknown')).rejects.toMatchObject({ status: 404 });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd apps/backend && npm test -- products.service.test 2>&1 | tail -20
```

Expected: new describe block fails.

- [ ] **Step 3: Add schemas to `products.validation.ts`**

Append to `apps/backend/src/modules/products/products.validation.ts`:

```ts
export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const searchQuerySchema = feedQuerySchema.extend({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['terbaru', 'termurah', 'termahal']).optional().default('terbaru'),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
```

- [ ] **Step 4: Update `products.service.ts`**

Replace the full file with:

```ts
import { CATEGORIES } from '@bantujual/categories';
import { NotFoundError, ValidationError } from '../../core/errors';
import { storageService, type StorageService } from '../../core/storage';
import {
  productsRepository,
  type ListFilters,
  type ProductDetailRow,
  type ProductListRow,
  type ProductsRepository,
} from './products.repository';
import type { CreateProductInput } from './products.validation';

export interface ProductsDeps {
  repo: ProductsRepository;
  storage: StorageService;
}

function validateCategoryAndAttributes(
  category: string,
  subcategory: string,
  attributes: Record<string, string | number>,
): void {
  const cat = CATEGORIES.find(c => c.id === category);
  if (!cat) throw new ValidationError(`Unknown category: ${category}`);

  const sub = cat.subcategories.find(s => s.id === subcategory);
  if (!sub) {
    throw new ValidationError(`Subcategory '${subcategory}' does not belong to category '${category}'`);
  }

  const allAttrs = [...cat.sharedAttributes, ...sub.attributes];
  const missing = allAttrs
    .filter(a => a.required)
    .filter(a => {
      const val = attributes[a.id];
      return val === undefined || val === '' || val === null;
    })
    .map(a => a.id);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required attributes: ${missing.join(', ')}`);
  }
}

function validatePhotoKeys(keys: string[]): void {
  const invalid = keys.filter(k => !k.startsWith('products/uploads/') || k.includes('..'));
  if (invalid.length > 0) throw new ValidationError('Invalid photo keys');
}

export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
}

export interface ProductDetailItem extends ProductListItem {
  description: string;
  attributes: Record<string, string | number>;
  listingStatus: string;
  approvalStatus: string;
}

export interface PaginatedItems<T> {
  items: T[];
  nextCursor: string | null;
}

function toListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    photos: row.firstImageUrl ? [{ url: row.firstImageUrl, position: 0 }] : [],
    category: row.category,
    subcategory: row.subcategory,
    location:
      row.locationName != null
        ? { name: row.locationName, lat: row.locationLat!, lng: row.locationLng! }
        : null,
    seller: row.seller,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetailItem(row: ProductDetailRow): ProductDetailItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    photos: row.photos,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    attributes: row.attributes,
    listingStatus: row.listingStatus,
    approvalStatus: row.approvalStatus,
    location:
      row.locationName != null
        ? { name: row.locationName, lat: row.locationLat!, lng: row.locationLng! }
        : null,
    seller: row.seller,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ProductWithImages {
  product: import('./products.repository').Product;
  images: import('./products.repository').ProductImage[];
}

export function createProductsService(deps: ProductsDeps) {
  const { repo, storage } = deps;

  return {
    async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
      return storage.presignUpload(count);
    },

    async createProduct(sellerId: string, input: CreateProductInput): Promise<ProductWithImages> {
      validateCategoryAndAttributes(input.category, input.subcategory, input.attributes);
      validatePhotoKeys(input.photos);

      const photos = input.photos.map((key, position) => ({
        url: storage.keyToPublicUrl(key),
        position,
      }));

      const expiresAt =
        input.listingStatus === 'active'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null;

      return repo.create({
        sellerId,
        name: input.name,
        price: input.price,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory,
        attributes: input.attributes,
        listingStatus: input.listingStatus,
        approvalStatus: 'pending',
        expiresAt,
        locationName: input.location.name,
        locationPlaceId: input.location.placeId,
        locationLat: input.location.lat,
        locationLng: input.location.lng,
        photos,
      });
    },

    async listFeed(input: {
      cursor?: string;
      limit?: number;
      sellerId?: string;
    }): Promise<PaginatedItems<ProductListItem>> {
      const { rows, nextCursor } = await repo.list({
        sortBy: 'terbaru',
        cursor: input.cursor,
        limit: input.limit,
        sellerId: input.sellerId,
      });
      return { items: rows.map(toListItem), nextCursor };
    },

    async searchProducts(input: ListFilters): Promise<PaginatedItems<ProductListItem>> {
      const { rows, nextCursor } = await repo.list(input);
      return { items: rows.map(toListItem), nextCursor };
    },

    async getProduct(id: string): Promise<ProductDetailItem> {
      const row = await repo.findById(id);
      if (!row) throw new NotFoundError('Product not found');
      return toDetailItem(row);
    },
  };
}

export type ProductsService = ReturnType<typeof createProductsService>;

export const productsService = createProductsService({
  repo: productsRepository,
  storage: storageService,
});
```

- [ ] **Step 5: Run tests**

```bash
cd apps/backend && npm test -- products.service.test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd apps/backend && git add src/modules/products/products.validation.ts src/modules/products/products.service.ts src/modules/products/products.service.test.ts && git commit -m "feat(products): add listFeed, searchProducts, getProduct service methods"
```

---

## Task 3 — products.routes.ts: add GET /feed, GET /search, GET /:id

**Files:**
- Modify: `apps/backend/src/modules/products/products.routes.ts`
- Modify: `apps/backend/src/modules/products/products.routes.test.ts`

- [ ] **Step 1: Add failing route tests**

Append to `apps/backend/src/modules/products/products.routes.test.ts`:

```ts
// Helper: insert a product directly as active+approved for route tests.
import { db } from '../../core/db/client';
import { products as productsTable } from '../../core/db/schema';
import { eq } from 'drizzle-orm';

async function seedApproved(sellerId: string) {
  const user = await usersRepository.create({ email: `seed-${Date.now()}@example.com` });
  const { product } = await (await import('./products.repository')).productsRepository.create({
    sellerId: user.id,
    name: 'Toyota Avanza 2020',
    price: 150_000_000,
    description: 'Kondisi baik',
    category: 'kendaraan',
    subcategory: 'mobil',
    attributes: { brand: 'Toyota', condition: 'Bekas', year: 2020, mileage: 30000, fuel: 'Bensin' },
    listingStatus: 'active',
    approvalStatus: 'pending',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    locationName: 'Jakarta Selatan',
    locationPlaceId: 'ChIJplace123',
    locationLat: -6.2146,
    locationLng: 106.8451,
    photos: [{ url: 'https://cdn.example.com/img.jpg', position: 0 }],
  });
  await db.update(productsTable).set({ approvalStatus: 'approved' }).where(eq(productsTable.id, product.id));
  return { user, product };
}

describe('GET /products/feed', () => {
  it('returns empty items when no approved listings', async () => {
    const res = await createApp().request('/products/feed');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(0);
    expect(body.nextCursor).toBeNull();
  });

  it('returns active+approved products', async () => {
    const user = await usersRepository.create({ email: 'feed-ok@example.com' });
    await seedApproved(user.id);
    const res = await createApp().request('/products/feed');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0]).toHaveProperty('id');
    expect(body.items[0]).toHaveProperty('photos');
    expect(body.items[0]).toHaveProperty('seller');
  });

  it('paginates using limit and nextCursor', async () => {
    for (let i = 0; i < 3; i++) {
      const u = await usersRepository.create({ email: `fp-${i}@example.com` });
      await seedApproved(u.id);
    }
    const page1 = await createApp().request('/products/feed?limit=2');
    expect(page1.status).toBe(200);
    const b1 = await page1.json() as any;
    expect(b1.items).toHaveLength(2);
    expect(b1.nextCursor).not.toBeNull();

    const page2 = await createApp().request(`/products/feed?limit=2&cursor=${encodeURIComponent(b1.nextCursor)}`);
    const b2 = await page2.json() as any;
    expect(b2.items).toHaveLength(1);
    expect(b2.nextCursor).toBeNull();
  });
});

describe('GET /products/search', () => {
  it('filters by q', async () => {
    const u = await usersRepository.create({ email: 'search-q@example.com' });
    await seedApproved(u.id); // name: 'Toyota Avanza 2020'
    const res = await createApp().request('/products/search?q=Toyota');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('returns empty for non-matching q', async () => {
    const u = await usersRepository.create({ email: 'search-none@example.com' });
    await seedApproved(u.id);
    const res = await createApp().request('/products/search?q=zzznomatch');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(0);
  });
});

describe('GET /products/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await createApp().request('/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('returns product detail with photos and seller', async () => {
    const u = await usersRepository.create({ email: 'detail-route@example.com' });
    const { product } = await seedApproved(u.id);
    const res = await createApp().request(`/products/${product.id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.product.id).toBe(product.id);
    expect(body.product.photos).toBeDefined();
    expect(body.product.seller).toHaveProperty('id');
    expect(body.product.description).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd apps/backend && npm test -- products.routes.test 2>&1 | grep -E "GET /products/feed|GET /products/search|GET /products/:id|FAIL" | head -20
```

Expected: new tests fail with 404 (routes not registered yet).

- [ ] **Step 3: Update `products.routes.ts`**

Replace the full file with:

```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { productsService } from './products.service';
import { presignSchema, createProductSchema, feedQuerySchema, searchQuerySchema } from './products.validation';

export const productsRoutes = new Hono<{ Variables: AppVariables }>();

// Read routes — unauthenticated, must be registered before /:id
productsRoutes.get('/feed', zValidator('query', feedQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await productsService.listFeed({ cursor, limit });
  return c.json(result);
});

productsRoutes.get('/search', zValidator('query', searchQuerySchema), async (c) => {
  const q = c.req.valid('query');
  const result = await productsService.searchProducts({
    q: q.q,
    category: q.category,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    sortBy: q.sortBy,
    cursor: q.cursor,
    limit: q.limit,
  });
  return c.json(result);
});

productsRoutes.get('/:id', async (c) => {
  const product = await productsService.getProduct(c.req.param('id'));
  return c.json({ product });
});

// Write routes — authenticated
productsRoutes.post('/images/presign', requireAuth, zValidator('json', presignSchema), async (c) => {
  const { count } = c.req.valid('json');
  const uploads = await productsService.presignUpload(count);
  return c.json({ uploads });
});

productsRoutes.post('/', requireAuth, zValidator('json', createProductSchema), async (c) => {
  const input = c.req.valid('json');
  const { product, images } = await productsService.createProduct(c.get('user').id, input);
  return c.json(
    {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        attributes: product.attributes,
        listingStatus: product.listingStatus,
        approvalStatus: product.approvalStatus,
        expiresAt: product.expiresAt,
        location: {
          name: product.locationName,
          placeId: product.locationPlaceId,
          lat: product.locationLat,
          lng: product.locationLng,
        },
        photos: images
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(i => ({ url: i.url, position: i.position })),
        createdAt: product.createdAt,
      },
    },
    201,
  );
});
```

- [ ] **Step 4: Run tests**

```bash
cd apps/backend && npm test -- products.routes.test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd apps/backend && git add src/modules/products/products.routes.ts src/modules/products/products.routes.test.ts && git commit -m "feat(products): add GET /feed, GET /search, GET /:id routes"
```

---

## Task 4 — users.service.ts + users.routes.ts: extend GET /users/:id + add GET /users/:id/products

**Files:**
- Modify: `apps/backend/src/modules/users/users.service.ts`
- Modify: `apps/backend/src/modules/users/users.service.test.ts`
- Modify: `apps/backend/src/modules/users/users.validation.ts`
- Modify: `apps/backend/src/modules/users/users.routes.ts`
- Modify: `apps/backend/src/modules/users/users.routes.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `apps/backend/src/modules/users/users.routes.test.ts`:

```ts
import { db } from '../../core/db/client';
import { products as productsTable } from '../../core/db/schema';
import { eq } from 'drizzle-orm';
import { productsRepository } from '../products/products.repository';

const baseProduct = {
  name: 'Toyota Avanza 2020',
  price: 150_000_000,
  description: 'Kondisi baik',
  category: 'kendaraan' as const,
  subcategory: 'mobil' as const,
  attributes: { brand: 'Toyota', condition: 'Bekas', year: 2020, mileage: 30000, fuel: 'Bensin' },
  listingStatus: 'active' as const,
  approvalStatus: 'pending' as const,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  locationName: 'Jakarta',
  locationPlaceId: 'place-1',
  locationLat: -6.2,
  locationLng: 106.8,
  photos: [{ url: 'https://cdn.example.com/img.jpg', position: 0 }],
};

async function createApprovedProduct(sellerId: string) {
  const { product } = await productsRepository.create({ sellerId, ...baseProduct });
  await db.update(productsTable).set({ approvalStatus: 'approved' }).where(eq(productsTable.id, product.id));
  return product;
}

describe('GET /users/:id — extended response', () => {
  it('includes createdAt and activeListingCount', async () => {
    const u = await usersRepository.create({ email: 'extended@example.com' });
    await createApprovedProduct(u.id);
    await createApprovedProduct(u.id);
    const res = await createApp().request(`/users/${u.id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.createdAt).toBeDefined();
    expect(body.activeListingCount).toBe(2);
  });
});

describe('GET /users/:id/products', () => {
  it('returns seller active+approved products', async () => {
    const u = await usersRepository.create({ email: 'seller-products@example.com' });
    await createApprovedProduct(u.id);
    const res = await createApp().request(`/users/${u.id}/products`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(1);
    expect(body.items[0].seller.id).toBe(u.id);
  });

  it('returns empty for seller with no approved listings', async () => {
    const u = await usersRepository.create({ email: 'no-products@example.com' });
    const res = await createApp().request(`/users/${u.id}/products`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(0);
  });
});
```

Also update `users.service.test.ts` — the `createUsersService` signature is changing to accept a deps object. Replace the `makeFakeRepo()` call sites:

```ts
// At the top of every describe block or it that calls createUsersService, change:
//   createUsersService(makeFakeRepo())
// to:
//   createUsersService({ repo: makeFakeRepo(), countActiveListings: async () => 0 })
```

Specifically, in `users.service.test.ts`:
- `const svc = createUsersService(makeFakeRepo())` → `const svc = createUsersService({ repo: makeFakeRepo(), countActiveListings: async () => 0 })`

Add a new test at the end of `users.service.test.ts`:

```ts
it('getById includes createdAt and activeListingCount', async () => {
  const repo = makeFakeRepo();
  const svc = createUsersService({ repo, countActiveListings: async () => 7 });
  const u = await svc.findOrCreateByEmail('count@example.com');
  const profile = await svc.getById(u.id);
  expect(profile.activeListingCount).toBe(7);
  expect(profile.createdAt).toBeDefined();
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd apps/backend && npm test -- users 2>&1 | tail -20
```

Expected: new tests fail; existing service tests may also fail due to changed signature (expected).

- [ ] **Step 3: Update `users.service.ts`**

Replace the full file with:

```ts
// src/modules/users/users.service.ts
import { NotFoundError } from '../../core/errors';
import { productsRepository } from '../products/products.repository';
import {
  usersRepository,
  type User,
  type UsersRepository,
  type UpdateUserInput,
} from './users.repository';

export interface PublicUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  activeListingCount: number;
}

export interface UsersDeps {
  repo: UsersRepository;
  countActiveListings: (userId: string) => Promise<number>;
}

export function createUsersService({ repo, countActiveListings }: UsersDeps) {
  return {
    async findOrCreateByEmail(email: string): Promise<User> {
      return (await repo.findByEmail(email)) ?? (await repo.create({ email }));
    },

    async getMe(id: string): Promise<User> {
      const user = await repo.findById(id);
      if (!user) throw new NotFoundError('User not found');
      return user;
    },

    async getById(id: string): Promise<PublicUser> {
      const user = await repo.findById(id);
      if (!user) throw new NotFoundError('User not found');
      const activeListingCount = await countActiveListings(id);
      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        activeListingCount,
      };
    },

    async updateProfile(id: string, patch: UpdateUserInput): Promise<User> {
      const exists = await repo.findById(id);
      if (!exists) throw new NotFoundError('User not found');
      const profileCompleted = patch.profileCompleted ?? (patch.name != null ? true : undefined);
      return repo.update(id, { ...patch, profileCompleted });
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;

export const usersService = createUsersService({
  repo: usersRepository,
  countActiveListings: id => productsRepository.countForSeller(id),
});
```

- [ ] **Step 4: Update `users.service.test.ts`** — fix call sites

In `users.service.test.ts`, replace every `createUsersService(makeFakeRepo())` with `createUsersService({ repo: makeFakeRepo(), countActiveListings: async () => 0 })`. There are three such lines (one per `it` block currently). Add the new test from Step 1.

- [ ] **Step 5: Add `sellerProductsQuerySchema` to `users.validation.ts`**

Append to `apps/backend/src/modules/users/users.validation.ts`:

```ts
export const sellerProductsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
```

- [ ] **Step 6: Update `users.routes.ts`**

Replace the full file with:

```ts
// src/modules/users/users.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { usersService } from './users.service';
import { updateProfileSchema, sellerProductsQuerySchema } from './users.validation';
import { productsService } from '../products/products.service';

export const usersRoutes = new Hono<{ Variables: AppVariables }>();

// Protected routes first so `/me` is not captured by `/:id`.
usersRoutes.get('/me', requireAuth, async (c) => {
  const user = await usersService.getMe(c.get('user').id);
  return c.json(user);
});

usersRoutes.patch('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  const patch = c.req.valid('json');
  const updated = await usersService.updateProfile(c.get('user').id, patch);
  return c.json(updated);
});

usersRoutes.get('/:id/products', zValidator('query', sellerProductsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await productsService.listFeed({ sellerId: c.req.param('id'), cursor, limit });
  return c.json(result);
});

usersRoutes.get('/:id', async (c) => {
  const profile = await usersService.getById(c.req.param('id'));
  return c.json(profile);
});
```

- [ ] **Step 7: Run all tests**

```bash
cd apps/backend && npm test 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
cd apps/backend && git add src/modules/users/ && git commit -m "feat(users): extend GET /users/:id with createdAt+activeListingCount, add GET /users/:id/products"
```

---

## Task 5 — lib/api.ts: add fetch functions and types

**Files:**
- Modify: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Append to `apps/mobile/lib/api.ts`**

```ts
// --- Product read API ---

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
}

export interface ProductDetailItem extends ProductListItem {
  description: string;
  attributes: Record<string, string | number>;
  listingStatus: string;
  approvalStatus: string;
}

export interface PublicSellerProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  activeListingCount: number;
}

export interface PaginatedItems<T> {
  items: T[];
  nextCursor: string | null;
}

export interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'terbaru' | 'termurah' | 'termahal';
}

export async function fetchFeed(cursor?: string, limit?: number): Promise<PaginatedItems<ProductListItem>> {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', cursor);
  if (limit) qs.set('limit', String(limit));
  const q = qs.toString();
  return get<PaginatedItems<ProductListItem>>(`/products/feed${q ? `?${q}` : ''}`);
}

export async function fetchSearch(
  params: SearchParams,
  cursor?: string,
  limit?: number,
): Promise<PaginatedItems<ProductListItem>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.category) qs.set('category', params.category);
  if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (cursor) qs.set('cursor', cursor);
  if (limit) qs.set('limit', String(limit));
  return get<PaginatedItems<ProductListItem>>(`/products/search?${qs.toString()}`);
}

export async function fetchProduct(id: string): Promise<ProductDetailItem> {
  const data = await get<{ product: ProductDetailItem }>(`/products/${id}`);
  return data.product;
}

export async function fetchSeller(id: string): Promise<PublicSellerProfile> {
  return get<PublicSellerProfile>(`/users/${id}`);
}

export async function fetchSellerProducts(
  sellerId: string,
  cursor?: string,
): Promise<PaginatedItems<ProductListItem>> {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', cursor);
  const q = qs.toString();
  return get<PaginatedItems<ProductListItem>>(`/users/${sellerId}/products${q ? `?${q}` : ''}`);
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd apps/mobile && git add lib/api.ts && git commit -m "feat(api): add fetchFeed, fetchSearch, fetchProduct, fetchSeller, fetchSellerProducts"
```

---

## Task 6 — useProductFeed + wire HomeScreen

**Files:**
- Create: `apps/mobile/features/home/hooks/useProductFeed.ts`
- Modify: `apps/mobile/features/home/HomeScreen.tsx`

- [ ] **Step 1: Create `useProductFeed.ts`**

```ts
// apps/mobile/features/home/hooks/useProductFeed.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFeed } from '@/lib/api';
import type { Product } from '@/lib/types';

function normalize(item: Awaited<ReturnType<typeof fetchFeed>>['items'][number]): Product {
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

export function useProductFeed() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  const load = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (reset) setIsLoading(true);
    try {
      const result = await fetchFeed(reset ? undefined : cursorRef.current);
      const items = result.items.map(normalize);
      setData(prev => (reset ? items : [...prev, ...items]));
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.nextCursor !== null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load products'));
    } finally {
      isFetchingRef.current = false;
      if (reset) setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const fetchMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) load(false);
  }, [hasMore, load]);

  const refetch = useCallback(() => {
    cursorRef.current = undefined;
    setHasMore(true);
    load(true);
  }, [load]);

  return { data, isLoading, error, fetchMore, hasMore, refetch };
}
```

- [ ] **Step 2: Update `HomeScreen.tsx`**

Replace the mock data import and usage. Find these lines:

```tsx
import { mockProducts } from "@/lib/mockData";
```

Replace with:

```tsx
import { useProductFeed } from "./hooks/useProductFeed";
```

Inside `HomeScreen`, add the hook call after the existing hooks:

```tsx
const { data: products, isLoading: productsLoading } = useProductFeed();
```

Replace the product grid:

```tsx
{mockProducts.map((product, index) => (
  <ProductCard
    key={product.id}
    product={product}
    onPress={() => handleProductPress(product.id)}
    onSellerPress={() => handleSellerPress(product.sellerId ?? "")}
    width="48%"
    marginRight={index % 2 === 0 ? "4%" : 0}
  />
))}
```

With:

```tsx
{productsLoading ? (
  <Text className="text-gray-400 text-sm text-center py-4">Memuat produk...</Text>
) : (
  products.map((product, index) => (
    <ProductCard
      key={product.id}
      product={product}
      onPress={() => handleProductPress(product.id)}
      onSellerPress={() => handleSellerPress(product.sellerId ?? "")}
      width="48%"
      marginRight={index % 2 === 0 ? "4%" : 0}
    />
  ))
)}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd apps/mobile && git add features/home/hooks/useProductFeed.ts features/home/HomeScreen.tsx && git commit -m "feat(home): replace mockProducts with useProductFeed hook"
```

---

## Task 7 — useProductSearch + wire SearchProductsScreen

**Files:**
- Create: `apps/mobile/features/search/hooks/useProductSearch.ts`
- Modify: `apps/mobile/features/search/SearchProductsScreen.tsx`

- [ ] **Step 1: Create `useProductSearch.ts`**

```ts
// apps/mobile/features/search/hooks/useProductSearch.ts
import { useCallback, useRef, useState } from 'react';
import { fetchSearch, type SearchParams } from '@/lib/api';
import type { Product } from '@/lib/types';

function normalize(item: Awaited<ReturnType<typeof fetchSearch>>['items'][number]): Product {
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

export function useProductSearch() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const paramsRef = useRef<SearchParams>({});
  const isFetchingRef = useRef(false);

  const load = useCallback(async (params: SearchParams, reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (reset) { setIsLoading(true); paramsRef.current = params; }
    try {
      const result = await fetchSearch(params, reset ? undefined : cursorRef.current);
      const items = result.items.map(normalize);
      setData(prev => (reset ? items : [...prev, ...items]));
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.nextCursor !== null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Search failed'));
    } finally {
      isFetchingRef.current = false;
      if (reset) setIsLoading(false);
    }
  }, []);

  const search = useCallback(
    (params: SearchParams) => {
      cursorRef.current = undefined;
      setHasMore(false);
      load(params, true);
    },
    [load],
  );

  const fetchMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) load(paramsRef.current, false);
  }, [hasMore, load]);

  return { data, isLoading, error, hasMore, search, fetchMore };
}
```

- [ ] **Step 2: Update `SearchProductsScreen.tsx`**

Replace:
```tsx
import { mockProducts } from "@/lib/mockData";
```
With:
```tsx
import { useProductSearch } from "./hooks/useProductSearch";
import type { FilterState, SortOption } from "./context/FilterSheetContext";
```

Remove the existing state that filters mockProducts:
```tsx
// Remove these lines:
const [filteredProducts, setFilteredProducts] = useState(() => {
  if (!initialQuery.trim()) return mockProducts;
  return mockProducts.filter((p) =>
    p.name.toLowerCase().includes(initialQuery.toLowerCase()),
  );
});
const [sortBy, setSortBy] = useState<SortOption>("relevan");
```

Add the hook and replace the runSearch/handleFilter logic:

```tsx
const { data: filteredProducts, isLoading: searchLoading, hasMore, search, fetchMore } = useProductSearch();
const [sortBy, setSortBy] = useState<SortOption>("relevan");

const runSearch = useCallback(
  (query: string) => {
    const trimmed = query.trim();
    addToHistory(trimmed);
    setHasSubmitted(true);
    search({
      q: trimmed || undefined,
      sortBy: sortBy === 'relevan' ? undefined : (sortBy as 'terbaru' | 'termurah' | 'termahal'),
    });
  },
  [addToHistory, search, sortBy],
);

const handleFilter = useCallback((filters: FilterState) => {
  setSortBy(filters.sortBy);
  search({
    q: searchQuery.trim() || undefined,
    category: filters.categories[0] ?? undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    sortBy: filters.sortBy === 'relevan'
      ? undefined
      : (filters.sortBy as 'terbaru' | 'termurah' | 'termahal'),
  });
}, [search, searchQuery]);
```

In the results section of the JSX, add infinite scroll detection on the ScrollView:

```tsx
<ScrollView
  className="flex-1"
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 24 }}
  onScroll={({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 300 && hasMore) {
      fetchMore();
    }
  }}
  scrollEventThrottle={400}
>
```

Also remove the `initialQuery` auto-search from useState (since search is now async):

```tsx
// In useEffect after hook setup, trigger initial search if initialQuery is set:
useEffect(() => {
  if (initialQuery.trim()) {
    setHasSubmitted(true);
    search({ q: initialQuery.trim() });
  }
}, []); // intentionally empty deps — only runs once on mount
```

Remove the `handleChangeText` reference to `mockProducts` (just set `hasSubmitted` to false when text is empty, don't reset filteredProducts since the hook manages that).

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. Fix any type issues before continuing.

- [ ] **Step 4: Commit**

```bash
cd apps/mobile && git add features/search/hooks/useProductSearch.ts features/search/SearchProductsScreen.tsx && git commit -m "feat(search): replace mockProducts with useProductSearch hook and server-side search"
```

---

## Task 8 — useProduct + wire ProductDetailScreen

**Files:**
- Create: `apps/mobile/features/product/hooks/useProduct.ts`
- Modify: `apps/mobile/features/product/ProductDetailScreen.tsx`

- [ ] **Step 1: Create `useProduct.ts`**

```ts
// apps/mobile/features/product/hooks/useProduct.ts
import { useEffect, useState } from 'react';
import { fetchProduct, type ProductDetailItem } from '@/lib/api';

export function useProduct(id: string) {
  const [data, setData] = useState<ProductDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchProduct(id)
      .then(product => { if (!cancelled) { setData(product); setError(null); } })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e : new Error('Failed to load')); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading, error };
}
```

- [ ] **Step 2: Update `ProductDetailScreen.tsx`**

Replace:

```tsx
import { mockProducts } from "@/lib/mockData";
```

With:

```tsx
import { useProduct } from "./hooks/useProduct";
import { ApiError } from "@/lib/api";
import { View, Text } from "react-native";
```

Replace the body of `ProductDetailScreen`:

```tsx
export function ProductDetailScreen({ id }: ProductDetailScreenProps) {
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Memuat produk...</Text>
      </View>
    );
  }

  if (error || !product) {
    const is404 = error instanceof ApiError && error.status === 404;
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-gray-500 text-center">
          {is404 ? 'Produk tidak ditemukan.' : 'Gagal memuat produk. Coba lagi.'}
        </Text>
      </View>
    );
  }

  const productData = {
    name: product.name,
    price: product.price,
    description: product.description,
    photos: product.photos.map(p => p.url),
    category: product.category,
    sellerId: product.seller.id,
    sellerName: product.seller.name ?? 'Penjual',
  };

  const footerContent = (
    <Button
      onPress={() => {
        const conversationId = `product-${id}-seller-${productData.sellerId}`;
        router.push({
          pathname: `/chat/${conversationId}` as any,
          params: {
            productId: id,
            productName: productData.name,
            productPrice: productData.price,
            productImage: productData.photos[0],
            sellerId: productData.sellerId,
            sellerName: productData.sellerName,
          },
        });
      }}
      style={{ width: '100%' }}
    >
      Mulai chat
    </Button>
  );

  return (
    <ProductDetail
      product={productData}
      onBack={() => router.back()}
      onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
      footerContent={footerContent}
    />
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd apps/mobile && git add features/product/hooks/useProduct.ts features/product/ProductDetailScreen.tsx && git commit -m "feat(product): replace mockProducts.find with useProduct hook"
```

---

## Task 9 — useSeller + useSellerProducts + wire SellerProfileScreen

**Files:**
- Create: `apps/mobile/features/seller/hooks/useSeller.ts`
- Create: `apps/mobile/features/seller/hooks/useSellerProducts.ts`
- Modify: `apps/mobile/features/seller/SellerProfileScreen.tsx`

- [ ] **Step 1: Create `useSeller.ts`**

```ts
// apps/mobile/features/seller/hooks/useSeller.ts
import { useEffect, useState } from 'react';
import { fetchSeller, type PublicSellerProfile } from '@/lib/api';

export function useSeller(id: string) {
  const [data, setData] = useState<PublicSellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSeller(id)
      .then(seller => { if (!cancelled) { setData(seller); setError(null); } })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e : new Error('Failed to load')); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading, error };
}
```

- [ ] **Step 2: Create `useSellerProducts.ts`**

```ts
// apps/mobile/features/seller/hooks/useSellerProducts.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSellerProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

function normalize(item: Awaited<ReturnType<typeof fetchSellerProducts>>['items'][number]): Product {
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

export function useSellerProducts(sellerId: string) {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  const load = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (reset) setIsLoading(true);
    try {
      const result = await fetchSellerProducts(sellerId, reset ? undefined : cursorRef.current);
      const items = result.items.map(normalize);
      setData(prev => (reset ? items : [...prev, ...items]));
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.nextCursor !== null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load'));
    } finally {
      isFetchingRef.current = false;
      if (reset) setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    cursorRef.current = undefined;
    setHasMore(true);
    load(true);
  }, [sellerId, load]);

  const fetchMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) load(false);
  }, [hasMore, load]);

  return { data, isLoading, error, fetchMore, hasMore };
}
```

- [ ] **Step 3: Update `SellerProfileScreen.tsx`**

Replace the full file with:

```tsx
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { ProductCard } from '@/features/search/components/ProductCard';
import { useSeller } from './hooks/useSeller';
import { useSellerProducts } from './hooks/useSellerProducts';

interface SellerProfileScreenProps {
  id: string;
}

export function SellerProfileScreen({ id }: SellerProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: seller, isLoading: sellerLoading } = useSeller(id);
  const { data: products, fetchMore, hasMore } = useSellerProducts(id);

  const joinedYear = seller?.createdAt
    ? new Date(seller.createdAt).getFullYear().toString()
    : '—';

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center px-4 py-3 bg-background"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">Profil Penjual</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 300 && hasMore) {
            fetchMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View className="items-center py-6 px-5">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-white">
              {sellerLoading ? '?' : (seller?.name?.charAt(0).toUpperCase() ?? '?')}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">
            {sellerLoading ? '...' : (seller?.name ?? 'Penjual')}
          </Text>
          <Text className="text-sm text-gray-500">Bergabung {joinedYear}</Text>
        </View>

        <View className="flex-row justify-around py-4 mx-5 bg-white rounded-2xl mb-4">
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">
              {seller?.activeListingCount ?? '—'}
            </Text>
            <Text className="text-xs text-gray-500">Produk</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">—</Text>
            <Text className="text-xs text-gray-500">Rating</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">—</Text>
            <Text className="text-xs text-gray-500">Respon</Text>
          </View>
        </View>

        <View className="px-5 py-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Produk</Text>
          <View className="flex-row flex-wrap">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
                onSellerPress={() => router.push(`/user/${product.sellerId}`)}
                width="48%"
                marginRight={index % 2 === 0 ? "4%" : 0}
              />
            ))}
          </View>
          {products.length === 0 && !sellerLoading && (
            <Text className="text-sm text-gray-400 text-center py-4">
              Belum ada produk aktif.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Run full backend test suite one last time**

```bash
cd apps/backend && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Final commit**

```bash
cd apps/mobile && git add features/seller/ && git commit -m "feat(seller): replace mockSellers with useSeller + useSellerProducts hooks"
```
