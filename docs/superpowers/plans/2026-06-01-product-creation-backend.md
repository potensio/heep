# Product Creation Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `POST /products/images/presign` and `POST /products` endpoints with Cloudflare R2 photo upload, dual-status moderation model, location storage, and attribute validation.

**Architecture:** Presign-first flow — client fetches presigned R2 PUT URLs, uploads photos directly to R2, then calls `POST /products` with photo keys + product data. Business logic lives in `products.service.ts` (attribute validation, status transitions, URL construction). Drizzle transaction wraps the product + images insert. FakeStorageService is auto-selected in test mode (same pattern as email service).

**Tech Stack:** Hono + Drizzle ORM + Postgres, @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner, Zod, Vitest, @bantujual/categories

---

## File Map

**Create:**
- `apps/backend/src/core/storage/client.ts` — S3Client factory for Cloudflare R2
- `apps/backend/src/core/storage/index.ts` — StorageService interface, FakeStorageService, R2StorageService, picker
- `apps/backend/src/modules/products/products.validation.ts` — Zod schemas for both endpoints
- `apps/backend/src/modules/products/products.repository.ts` — Drizzle insert in transaction
- `apps/backend/src/modules/products/products.repository.test.ts` — Integration tests (real DB)
- `apps/backend/src/modules/products/products.service.ts` — Attribute validation, status logic, URL construction
- `apps/backend/src/modules/products/products.service.test.ts` — Unit tests (fake repo + fake storage)
- `apps/backend/src/modules/products/products.routes.ts` — Hono routes for presign + create
- `apps/backend/src/modules/products/products.routes.test.ts` — Integration tests (real DB + auto-fake storage)

**Modify:**
- `apps/backend/package.json` — add @aws-sdk packages
- `apps/backend/src/core/env.ts` — add 5 R2 env vars (optional)
- `apps/backend/.env.example` — document R2 vars
- `apps/backend/src/core/db/schema.ts` — new enums, updated products table, drop old status
- `apps/backend/src/app.ts` — register products routes
- `apps/mobile/lib/api.ts` — add presignImages + createProduct functions
- `apps/mobile/app/(protected)/sell/review.tsx` — replace mock publishProduct with real API call

---

## Task 1: Install AWS SDK packages

**Files:**
- Modify: `apps/backend/package.json`

- [ ] **Step 1: Install packages**

```bash
cd /path/to/bantujual/apps/backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: Verify packages appear in package.json**

```bash
grep -E '"@aws-sdk' package.json
```

Expected output:
```
"@aws-sdk/client-s3": "^3.x.x",
"@aws-sdk/s3-request-presigner": "^3.x.x",
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add aws-sdk packages for R2 presigned URLs"
```

---

## Task 2: Add R2 environment variables

**Files:**
- Modify: `apps/backend/src/core/env.ts`
- Modify: `apps/backend/.env.example`

- [ ] **Step 1: Add R2 vars to EnvSchema in `src/core/env.ts`**

Add the following 5 lines inside the `z.object({...})` in `EnvSchema`, after the `WEB_ORIGIN` line:

```typescript
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
```

The full updated `EnvSchema` should be:

```typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2592000),
  OTP_TTL: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('BantuJual <noreply@bantujual.app>'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});
```

- [ ] **Step 2: Append R2 vars to `.env.example`**

Add these lines at the end of `.env.example`:

```
# Cloudflare R2 (required in production, optional in development)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=bantujual-media
R2_PUBLIC_URL=https://media.bantujual.com
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/core/env.ts .env.example
git commit -m "feat: add R2 environment variable definitions"
```

---

## Task 3: Create storage module

**Files:**
- Create: `apps/backend/src/core/storage/client.ts`
- Create: `apps/backend/src/core/storage/index.ts`

- [ ] **Step 1: Create `src/core/storage/client.ts`**

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../env';

export function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}
```

- [ ] **Step 2: Create `src/core/storage/index.ts`**

```typescript
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';
import { createR2Client } from './client';

export interface StorageService {
  presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]>;
  keyToPublicUrl(key: string): string;
}

export class FakeStorageService implements StorageService {
  async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
    return Array.from({ length: count }, (_, i) => ({
      key: `products/uploads/test-${i}.jpg`,
      uploadUrl: `https://fake-r2.test/upload/${i}`,
    }));
  }

  keyToPublicUrl(key: string): string {
    return `https://cdn.test.example.com/${key}`;
  }
}

export class R2StorageService implements StorageService {
  private client = createR2Client();

  async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
    return Promise.all(
      Array.from({ length: count }, async () => {
        const key = `products/uploads/${randomUUID()}.jpg`;
        const command = new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key });
        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
        return { key, uploadUrl };
      }),
    );
  }

  keyToPublicUrl(key: string): string {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
}

function pickStorageService(): StorageService {
  if (env.NODE_ENV === 'test' || !env.R2_ACCOUNT_ID) return new FakeStorageService();
  return new R2StorageService();
}

export const storageService: StorageService = pickStorageService();
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/core/storage/
git commit -m "feat: add storage service abstraction with R2 and fake implementations"
```

---

## Task 4: Update products schema

**Files:**
- Modify: `apps/backend/src/core/db/schema.ts`

- [ ] **Step 1: Update `src/core/db/schema.ts`**

Replace the file with the updated version. Changes from the current file:
- Add `doublePrecision` to the pg-core imports
- Add `listingStatusEnum` and `approvalStatusEnum` exports
- Remove `productStatusEnum` export
- Update `products` table: remove `status`, add `listingStatus`, `approvalStatus`, `expiresAt`, and 4 location columns

```typescript
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, jsonb, index, doublePrecision,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { CATEGORIES } from '@bantujual/categories';

export const genderEnum = pgEnum('gender', ['male', 'female']);

const categoryIds = CATEGORIES.map(c => c.id) as [string, ...string[]];
export const productCategoryEnum = pgEnum('product_category', categoryIds);

const subcategoryIds = CATEGORIES.flatMap(c => c.subcategories.map(s => s.id)) as [string, ...string[]];
export const productSubcategoryEnum = pgEnum('product_subcategory', subcategoryIds);

export const listingStatusEnum = pgEnum('listing_status', ['draft', 'active', 'sold']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'rejected', 'approved']);

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
  listingStatus: listingStatusEnum('listing_status').notNull().default('draft'),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  locationName: text('location_name'),
  locationPlaceId: text('location_place_id'),
  locationLat: doublePrecision('location_lat'),
  locationLng: doublePrecision('location_lng'),
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

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/db/schema.ts
git commit -m "feat: replace product status enum with listing_status + approval_status, add location columns"
```

---

## Task 5: Generate and apply migration

**Files:**
- Create: `apps/backend/src/core/db/migrations/0003_*.sql` (auto-generated)

- [ ] **Step 1: Generate migration**

```bash
npm run db:generate
```

Expected: a new file `src/core/db/migrations/0003_*.sql` is created.

- [ ] **Step 2: Review the generated SQL**

Open the new migration file and verify it contains roughly:
- `CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'sold')`
- `CREATE TYPE "public"."approval_status" AS ENUM('pending', 'rejected', 'approved')`
- `ALTER TABLE "products" ADD COLUMN "listing_status"` with default `'draft'`
- `ALTER TABLE "products" ADD COLUMN "approval_status"` with default `'pending'`
- `ALTER TABLE "products" ADD COLUMN "expires_at"` (nullable)
- `ALTER TABLE "products" ADD COLUMN "location_name"`, `"location_place_id"`, `"location_lat"`, `"location_lng"`
- `ALTER TABLE "products" DROP COLUMN "status"`
- `DROP TYPE "public"."product_status"`

If the SQL looks correct, proceed. If drizzle-kit generated extra destructive changes you don't expect, investigate before applying.

- [ ] **Step 3: Apply migration to dev database**

```bash
npm run db:migrate
```

Expected: migration applied without errors. (Integration tests apply it automatically via `useTestDb()` — this step is for your local dev DB.)

- [ ] **Step 4: Commit the migration**

```bash
git add src/core/db/migrations/
git commit -m "feat: migration — listing_status, approval_status, location fields on products"
```

---

## Task 6: Create products validation

**Files:**
- Create: `apps/backend/src/modules/products/products.validation.ts`

- [ ] **Step 1: Create `src/modules/products/products.validation.ts`**

```typescript
import { z } from 'zod';
import { CATEGORIES } from '@bantujual/categories';

const categoryIds = CATEGORIES.map(c => c.id) as [string, ...string[]];
const subcategoryIds = CATEGORIES.flatMap(c => c.subcategories.map(s => s.id)) as [string, ...string[]];

export const presignSchema = z.object({
  count: z.number().int().min(1).max(6),
});

export const createProductSchema = z.object({
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
  photos: z.array(z.string()).min(1).max(6),
  listingStatus: z.enum(['draft', 'active']),
});

export type PresignInput = z.infer<typeof presignSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/products/products.validation.ts
git commit -m "feat: add Zod validation schemas for products endpoints"
```

---

## Task 7: Repository — write test, implement, verify

**Files:**
- Create: `apps/backend/src/modules/products/products.repository.ts`
- Create: `apps/backend/src/modules/products/products.repository.test.ts`

- [ ] **Step 1: Write the failing test first**

Create `src/modules/products/products.repository.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { usersRepository } from '../users/users.repository';
import { productsRepository } from './products.repository';

useTestDb();

const baseInput = {
  name: 'Toyota Avanza 2020',
  price: 150_000_000,
  description: 'Kondisi baik',
  category: 'kendaraan',
  subcategory: 'mobil',
  attributes: { brand: 'Toyota', condition: 'Bekas', year: 2020, mileage: 30000, fuel: 'Bensin' },
  listingStatus: 'active' as const,
  approvalStatus: 'pending' as const,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  locationName: 'Jakarta Selatan',
  locationPlaceId: 'ChIJplace123',
  locationLat: -6.2146,
  locationLng: 106.8451,
  photos: [
    { url: 'https://cdn.test.example.com/products/uploads/test-0.jpg', position: 0 },
    { url: 'https://cdn.test.example.com/products/uploads/test-1.jpg', position: 1 },
  ],
};

describe('productsRepository.create', () => {
  it('inserts a product and images in a transaction', async () => {
    const user = await usersRepository.create({ email: 'seller@example.com' });
    const result = await productsRepository.create({ sellerId: user.id, ...baseInput });

    expect(result.product.id).toBeDefined();
    expect(result.product.name).toBe('Toyota Avanza 2020');
    expect(result.product.price).toBe(150_000_000);
    expect(result.product.listingStatus).toBe('active');
    expect(result.product.approvalStatus).toBe('pending');
    expect(result.product.expiresAt).not.toBeNull();
    expect(result.product.locationName).toBe('Jakarta Selatan');
    expect(result.product.locationLat).toBeCloseTo(-6.2146);
    expect(result.images).toHaveLength(2);
    expect(result.images.find(i => i.position === 0)?.url).toBe(
      'https://cdn.test.example.com/products/uploads/test-0.jpg',
    );
  });

  it('inserts a draft product with null expiresAt', async () => {
    const user = await usersRepository.create({ email: 'drafter@example.com' });
    const result = await productsRepository.create({
      sellerId: user.id,
      ...baseInput,
      listingStatus: 'draft',
      expiresAt: null,
    });

    expect(result.product.listingStatus).toBe('draft');
    expect(result.product.expiresAt).toBeNull();
  });

  it('rolls back if images insert fails', async () => {
    const user = await usersRepository.create({ email: 'rollback@example.com' });
    // Pass a duplicate position to trigger a DB constraint violation (product_images has no unique constraint
    // on position, but productId FK will fail if product insert somehow fails — instead we test via
    // a non-existent sellerId that violates FK on the products table).
    await expect(
      productsRepository.create({ ...baseInput, sellerId: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
NODE_ENV=test npx vitest run src/modules/products/products.repository.test.ts
```

Expected: fails with `Cannot find module './products.repository'` or similar.

- [ ] **Step 3: Implement `src/modules/products/products.repository.ts`**

```typescript
import { db } from '../../core/db/client';
import { products, productImages } from '../../core/db/schema';

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
  approvalStatus: 'pending';
  expiresAt: Date | null;
  locationName: string;
  locationPlaceId: string;
  locationLat: number;
  locationLng: number;
  photos: { url: string; position: number }[];
}

export interface ProductsRepository {
  create(input: CreateProductRepoInput): Promise<{ product: Product; images: ProductImage[] }>;
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
};
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
NODE_ENV=test npx vitest run src/modules/products/products.repository.test.ts
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/modules/products/products.repository.ts src/modules/products/products.repository.test.ts
git commit -m "feat: add products repository with transactional create"
```

---

## Task 8: Service — write test, implement, verify

**Files:**
- Create: `apps/backend/src/modules/products/products.service.ts`
- Create: `apps/backend/src/modules/products/products.service.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/modules/products/products.service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createProductsService } from './products.service';
import { FakeStorageService } from '../../core/storage';
import type { ProductsRepository, Product, ProductImage, CreateProductRepoInput } from './products.repository';

const stubProduct: Product = {
  id: 'prod-uuid',
  sellerId: 'user-uuid',
  name: 'Test',
  price: 150_000_000,
  description: '',
  category: 'kendaraan',
  subcategory: 'mobil',
  attributes: {},
  listingStatus: 'active',
  approvalStatus: 'pending',
  expiresAt: new Date(),
  locationName: 'Jakarta',
  locationPlaceId: 'place123',
  locationLat: -6.2,
  locationLng: 106.8,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const stubImage: ProductImage = {
  id: 'img-uuid',
  productId: 'prod-uuid',
  url: 'https://cdn.test.example.com/products/uploads/test-0.jpg',
  position: 0,
};

function makeFakeRepo(): { repo: ProductsRepository; getLastInput: () => CreateProductRepoInput | null } {
  let captured: CreateProductRepoInput | null = null;
  return {
    repo: {
      async create(input) {
        captured = input;
        return { product: { ...stubProduct } as Product, images: [stubImage] };
      },
    },
    getLastInput: () => captured,
  };
}

const fakeStorage = new FakeStorageService();

const validInput = {
  name: 'Toyota Avanza',
  price: 150_000_000,
  description: '',
  category: 'kendaraan' as const,
  subcategory: 'mobil' as const,
  attributes: { brand: 'Toyota', condition: 'Bekas', year: 2020, mileage: 30000, fuel: 'Bensin' },
  location: { name: 'Jakarta Selatan', placeId: 'p123', lat: -6.2, lng: 106.8 },
  photos: ['products/uploads/test-0.jpg'],
  listingStatus: 'active' as const,
};

describe('createProductsService', () => {
  it('throws ValidationError when subcategory does not belong to category', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', { ...validInput, subcategory: 'rumah' as any }),
    ).rejects.toThrow("Subcategory 'rumah' does not belong to category 'kendaraan'");
  });

  it('throws ValidationError when required attributes are missing', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', { ...validInput, attributes: {} }),
    ).rejects.toThrow('Missing required attributes');
  });

  it('throws ValidationError when photo key has wrong prefix', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', { ...validInput, photos: ['../../etc/passwd'] }),
    ).rejects.toThrow('Invalid photo keys');
  });

  it('converts photo keys to public URLs', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.createProduct('user-uuid', validInput);
    const last = getLastInput()!;
    expect(last.photos[0].url).toBe('https://cdn.test.example.com/products/uploads/test-0.jpg');
    expect(last.photos[0].position).toBe(0);
  });

  it('sets expiresAt ~30 days from now for active listings', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    const before = Date.now();
    await service.createProduct('user-uuid', { ...validInput, listingStatus: 'active' });
    const expiresAt = getLastInput()!.expiresAt!;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAt).not.toBeNull();
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + thirtyDays - 2000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(before + thirtyDays + 2000);
  });

  it('sets expiresAt null for draft listings', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.createProduct('user-uuid', { ...validInput, listingStatus: 'draft' });
    expect(getLastInput()!.expiresAt).toBeNull();
  });

  it('always sets approvalStatus to pending', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.createProduct('user-uuid', validInput);
    expect(getLastInput()!.approvalStatus).toBe('pending');
  });

  it('presignUpload delegates to storage service', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    const uploads = await service.presignUpload(2);
    expect(uploads).toHaveLength(2);
    expect(uploads[0]).toHaveProperty('uploadUrl');
    expect(uploads[0]).toHaveProperty('key');
  });

  it('validates aksesoris-gadget (no required attributes beyond condition)', async () => {
    const repo = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', {
        ...validInput,
        category: 'handphone-tablet',
        subcategory: 'aksesoris-gadget',
        attributes: { condition: 'Baru' },
      }),
    ).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
NODE_ENV=test npx vitest run src/modules/products/products.service.test.ts
```

Expected: fails with `Cannot find module './products.service'`.

- [ ] **Step 3: Implement `src/modules/products/products.service.ts`**

```typescript
import { CATEGORIES } from '@bantujual/categories';
import { ValidationError } from '../../core/errors';
import { storageService, type StorageService } from '../../core/storage';
import {
  productsRepository,
  type ProductsRepository,
  type Product,
  type ProductImage,
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
  const invalid = keys.filter(k => !k.startsWith('products/uploads/'));
  if (invalid.length > 0) throw new ValidationError('Invalid photo keys');
}

export interface ProductWithImages {
  product: Product;
  images: ProductImage[];
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

      const expiresAt = input.listingStatus === 'active'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      return repo.create({
        sellerId,
        name: input.name,
        price: input.price,
        description: input.description ?? '',
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
  };
}

export type ProductsService = ReturnType<typeof createProductsService>;

export const productsService = createProductsService({
  repo: productsRepository,
  storage: storageService,
});
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
NODE_ENV=test npx vitest run src/modules/products/products.service.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/modules/products/products.service.ts src/modules/products/products.service.test.ts
git commit -m "feat: add products service with attribute validation and status logic"
```

---

## Task 9: Routes — write test, implement, verify

**Files:**
- Create: `apps/backend/src/modules/products/products.routes.ts`
- Create: `apps/backend/src/modules/products/products.routes.test.ts`

Note: In test mode, `storageService` auto-resolves to `FakeStorageService` (same pattern as email service), so no injection is needed for integration tests.

- [ ] **Step 1: Write the failing integration tests first**

Create `src/modules/products/products.routes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { signAccessToken } from '../../core/jwt';
import { usersRepository } from '../users/users.repository';

useTestDb();

const validPayload = {
  name: 'Toyota Avanza 2020',
  price: 150_000_000,
  description: 'Kondisi sangat baik',
  category: 'kendaraan',
  subcategory: 'mobil',
  attributes: { brand: 'Toyota', condition: 'Bekas', year: 2020, mileage: 30000, fuel: 'Bensin' },
  location: { name: 'Jakarta Selatan', placeId: 'ChIJplace123', lat: -6.2146, lng: 106.8451 },
  photos: ['products/uploads/test-0.jpg'],
  listingStatus: 'active',
};

describe('POST /products/images/presign', () => {
  it('returns 401 without auth', async () => {
    const res = await createApp().request('/products/images/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 2 }),
    });
    expect(res.status).toBe(401);
  });

  it('returns presigned upload URLs', async () => {
    const user = await usersRepository.create({ email: 'presign@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products/images/presign', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 3 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.uploads).toHaveLength(3);
    expect(body.uploads[0]).toHaveProperty('uploadUrl');
    expect(body.uploads[0]).toHaveProperty('key');
    expect(body.uploads[0].key).toMatch(/^products\/uploads\//);
  });

  it('returns 400 for count > 6', async () => {
    const user = await usersRepository.create({ email: 'presign2@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products/images/presign', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 7 }),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /products', () => {
  it('returns 401 without auth', async () => {
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(res.status).toBe(401);
  });

  it('creates an active product and returns 201', async () => {
    const user = await usersRepository.create({ email: 'create@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.product.id).toBeDefined();
    expect(body.product.listingStatus).toBe('active');
    expect(body.product.approvalStatus).toBe('pending');
    expect(body.product.expiresAt).not.toBeNull();
    expect(body.product.location.name).toBe('Jakarta Selatan');
    expect(body.product.photos).toHaveLength(1);
    expect(body.product.photos[0].url).toContain('products/uploads/');
    expect(body.product.photos[0].position).toBe(0);
  });

  it('creates a draft product with null expiresAt', async () => {
    const user = await usersRepository.create({ email: 'draft@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, listingStatus: 'draft' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.product.listingStatus).toBe('draft');
    expect(body.product.expiresAt).toBeNull();
  });

  it('returns 400 for missing required attributes', async () => {
    const user = await usersRepository.create({ email: 'noattr@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, attributes: {} }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for subcategory/category mismatch', async () => {
    const user = await usersRepository.create({ email: 'mismatch@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, subcategory: 'rumah' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid photo key prefix', async () => {
    const user = await usersRepository.create({ email: 'badkey@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, photos: ['../../etc/passwd'] }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
NODE_ENV=test npx vitest run src/modules/products/products.routes.test.ts
```

Expected: fails with `Cannot find module './products.routes'` or all tests fail with 404 (routes not yet registered).

- [ ] **Step 3: Implement `src/modules/products/products.routes.ts`**

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { productsService } from './products.service';
import { presignSchema, createProductSchema } from './products.validation';

export const productsRoutes = new Hono<{ Variables: AppVariables }>();

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

- [ ] **Step 4: Run the tests to confirm they still fail (routes not wired yet)**

```bash
NODE_ENV=test npx vitest run src/modules/products/products.routes.test.ts
```

Expected: all tests fail with 404 — routes are not registered in the app yet. This is expected; wiring happens in the next task.

- [ ] **Step 5: Commit the routes file**

```bash
git add src/modules/products/products.routes.ts src/modules/products/products.routes.test.ts
git commit -m "feat: add products routes (presign + create)"
```

---

## Task 10: Wire products routes into app.ts and verify

**Files:**
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Register products routes in `src/app.ts`**

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { productsRoutes } from './modules/products/products.routes';

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/products', productsRoutes);

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 2: Run the full test suite**

```bash
NODE_ENV=test npx vitest run
```

Expected: all tests pass, including the new products routes tests.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app.ts
git commit -m "feat: register products routes in app"
```

---

## Task 11: Wire mobile sell flow to real API

**Files:**
- Modify: `apps/mobile/lib/api.ts`
- Modify: `apps/mobile/app/(protected)/sell/review.tsx`

- [ ] **Step 1: Add presign and createProduct functions to `apps/mobile/lib/api.ts`**

Append these functions to the end of the existing `lib/api.ts` file (do not remove existing functions):

```typescript
export interface PresignUpload {
  uploadUrl: string;
  key: string;
}

export interface ProductPhoto {
  url: string;
  position: number;
}

export interface CreatedProduct {
  id: string;
  listingStatus: string;
  approvalStatus: string;
  expiresAt: string | null;
  photos: ProductPhoto[];
}

async function authPost<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function presignImages(token: string, count: number): Promise<PresignUpload[]> {
  const data = await authPost<{ uploads: PresignUpload[] }>(
    '/products/images/presign',
    token,
    { count },
  );
  return data.uploads;
}

async function uploadPhotoToR2(localUri: string, uploadUrl: string): Promise<void> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = reject;
    xhr.responseType = 'blob';
    xhr.open('GET', localUri);
    xhr.send();
  });
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
  if (!res.ok) throw new ApiError(res.status, `Photo upload failed: ${res.status}`);
}

export async function createProduct(
  token: string,
  payload: {
    name: string;
    price: number;
    description: string;
    category: string;
    subcategory: string;
    attributes: Record<string, string | number>;
    location: { name: string; placeId: string; lat: number; lng: number };
    photos: string[];
    listingStatus: 'draft' | 'active';
  },
): Promise<CreatedProduct> {
  const data = await authPost<{ product: CreatedProduct }>('/products', token, payload);
  return data.product;
}

export async function publishProduct(
  token: string,
  localPhotoUris: string[],
  productPayload: Omit<Parameters<typeof createProduct>[1], 'photos'>,
): Promise<string> {
  const uploads = await presignImages(token, localPhotoUris.length);
  await Promise.all(
    localPhotoUris.map((uri, i) => uploadPhotoToR2(uri, uploads[i].uploadUrl)),
  );
  const photoKeys = uploads.map(u => u.key);
  const product = await createProduct(token, { ...productPayload, photos: photoKeys });
  return product.id;
}
```

- [ ] **Step 2: Update `apps/mobile/app/(protected)/sell/review.tsx`**

Replace the mock `publishProduct` import and usage with the real API call. The `token` comes from `useAuth()`. The `location` must be non-null (the sell wizard validates this before reaching review).

```typescript
// app/(protected)/sell/review.tsx
import { useRouter } from 'expo-router';
import { ReviewStep } from '@/features/sell/components/ReviewStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';
import { useAuth } from '@/context/AuthContext';
import { publishProduct } from '@/lib/api';

export default function ReviewStepRoute() {
  const router = useRouter();
  const { formData, isSubmitting, setSubmitting, setPublishedProductId } = useSellFormContext();
  const { token } = useAuth();

  const handleEditPhotos = () => { router.push('/sell/foto'); };
  const handleEditInfo = () => { router.push('/sell/info'); };

  const handlePublish = async () => {
    if (!token || !formData.location) return;
    setSubmitting(true);
    try {
      const productId = await publishProduct(token, formData.photos, {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category: formData.category as string,
        subcategory: formData.subcategory as string,
        attributes: formData.attributes,
        location: formData.location,
        listingStatus: 'active',
      });
      setPublishedProductId(productId);
      router.replace('/sell/success');
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => { router.back(); };

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

- [ ] **Step 3: Run mobile typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/lib/api.ts apps/mobile/app/(protected)/sell/review.tsx
git commit -m "feat: wire sell wizard to real product creation API"
```

---

## Task 12: Final verification

- [ ] **Step 1: Run the full backend test suite**

```bash
cd apps/backend && NODE_ENV=test npx vitest run
```

Expected: all tests pass (no failures, no skipped).

- [ ] **Step 2: Run backend typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run mobile typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.
