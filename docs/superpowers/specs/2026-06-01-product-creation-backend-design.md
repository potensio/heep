# Product Creation Backend — Design Spec

**Date:** 2026-06-01  
**Status:** Approved  
**Scope:** Product creation API including photo upload via Cloudflare R2 presigned URLs, location storage, and a dual-status moderation model.

---

## Overview

Implement the backend for the sell wizard's publish step. The mobile app collects photos, product info, category/attributes, and location across a 4-step wizard. On submit, it uploads photos directly to Cloudflare R2 and calls a product creation endpoint. Products enter a moderation queue (`approval_status: pending`) before becoming visible to buyers.

---

## Data Model

### New Migration

The existing `status` column (`active | sold | draft`) is replaced by two orthogonal fields. Migration adds:

**New Postgres enums:**
- `listing_status`: `draft | active | sold`
- `approval_status`: `pending | rejected | approved`

**Columns added to `products`:**

| Column | Type | Default | Notes |
|---|---|---|---|
| `listing_status` | `listing_status` enum | `draft` | Replaces the old `status` column |
| `approval_status` | `approval_status` enum | `pending` | Relevant when `listing_status = active` |
| `expires_at` | `timestamptz` | null | Set to `now + 30 days` when `listing_status → active` |
| `location_name` | text | null | City display name |
| `location_place_id` | text | null | Google Places ID |
| `location_lat` | `numeric(10,7)` | null | |
| `location_lng` | `numeric(10,7)` | null | |

The old `status` column and `product_status` enum are dropped in the same migration.

**`product_images` table** is unchanged — `url` stores the public R2 URL constructed from the storage key.

### Product Lifecycle

```
Seller creates product
  → listing_status: draft | active
  → approval_status: pending (always)
  → expires_at: null (draft) | now + 30 days (active)

Admin reviews
  → approval_status: approved → visible to buyers
  → approval_status: rejected → hidden from buyers

Product age > 30 days (expires_at < now)
  → filtered out of buyer-facing queries (no status change needed)
```

Buyer visibility rule: `listing_status = active AND approval_status = approved AND expires_at > now`.

---

## API Contract

Both endpoints require a valid Bearer token (`requireAuth` middleware).

### `POST /products/images/presign`

Generates presigned R2 upload URLs. The client uploads images directly to R2 — no image bytes pass through the backend.

**Request:**
```json
{ "count": 3 }
```
`count`: integer, 1–6.

**Response `200`:**
```json
{
  "uploads": [
    { "uploadUrl": "https://...", "key": "products/uploads/<uuid>.jpg" },
    { "uploadUrl": "https://...", "key": "products/uploads/<uuid>.jpg" }
  ]
}
```

Each `uploadUrl` is valid for 5 minutes. The client passes the `key` values to `POST /products`.

---

### `POST /products`

Creates a product. Photo keys from the presign step are converted to public URLs and stored in `product_images`.

**Request:**
```typescript
{
  name: string             // 3–100 chars
  price: number            // integer, min 1000 (Rupiah)
  description?: string     // max 500 chars
  category: CategoryId     // 'kendaraan' | 'properti' | 'handphone-tablet'
  subcategory: SubcategoryId
  attributes: Record<string, string | number>
  location: {
    name: string
    placeId: string
    lat: number
    lng: number
  }
  photos: string[]         // R2 keys from presign step, 1–6 items
  listingStatus: 'draft' | 'active'
}
```

**Behaviour:**
- Validates `subcategory` belongs to `category`
- Validates all required `attributes` for the subcategory (via `@bantujual/categories`)
- Validates each photo key starts with `products/uploads/`
- Converts photo keys → public R2 URLs, inserts into `product_images` with `position` = array index
- If `listingStatus = 'active'`: sets `approval_status: 'pending'`, `expires_at = now + 30 days`
- If `listingStatus = 'draft'`: `approval_status: 'pending'`, `expires_at = null` (approval status is irrelevant until the seller publishes, but stored as pending for consistency)
- Wraps product + images insert in a single DB transaction

**Response `201`:**
```typescript
{
  "product": {
    "id": "uuid",
    "name": "...",
    "price": 150000,
    "description": "...",
    "category": "kendaraan",
    "subcategory": "mobil",
    "attributes": { "brand": "Toyota", "condition": "Bekas", ... },
    "listingStatus": "active",
    "approvalStatus": "pending",
    "expiresAt": "2026-07-01T00:00:00Z",
    "location": { "name": "Jakarta Selatan", "placeId": "...", "lat": -6.2, "lng": 106.8 },
    "photos": [
      { "url": "https://cdn.bantujual.com/products/uploads/abc.jpg", "position": 0 }
    ],
    "createdAt": "..."
  }
}
```

**Errors:**

| Scenario | Code | Status |
|---|---|---|
| Invalid photo count | `VALIDATION_ERROR` | 400 |
| Invalid subcategory for category | `VALIDATION_ERROR` | 400 |
| Missing required attributes | `VALIDATION_ERROR` | 400 |
| Invalid photo key prefix | `VALIDATION_ERROR` | 400 |
| No/invalid auth token | `UNAUTHORIZED` | 401 |
| R2 presign failure | (internal) | 500 |

---

## Module Structure

### `src/modules/products/`

```
products.routes.ts          POST /products/images/presign, POST /products
products.routes.test.ts     Integration tests (real DB + fake storage)
products.service.ts         Attribute validation, status logic, photo URL construction
products.service.test.ts    Unit tests (fake repository + fake storage)
products.repository.ts      Drizzle: insert product + images in a transaction
products.repository.test.ts
products.validation.ts      Zod schemas for both endpoints
```

### `src/core/storage/`

```
client.ts    R2 client (AWS SDK v3: @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner)
index.ts     Storage interface + presignUpload() + keyToPublicUrl() + fake implementation
```

The storage module exposes an interface identical to the email service pattern:

```typescript
export interface StorageService {
  presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]>
  keyToPublicUrl(key: string): string
}
```

The fake implementation returns predictable keys and URLs for tests — no real R2 calls.

### New Environment Variables

Added to `src/core/env.ts` Zod schema:

| Variable | Description |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public base URL (e.g. `https://cdn.bantujual.com`) |

---

## Attribute Validation

Implemented in `products.service.ts` using `@bantujual/categories`:

```
validateAttributes(category, subcategory, attributes):
  1. Look up subcategory definition from CATEGORIES
  2. Collect attributes = sharedAttributes + subcategory.attributes
  3. For each attribute where required = true:
     if missing or empty → add to errors list
  4. If errors → throw ValidationError('Missing required attributes: <list>')
```

This logic lives in the service layer (not Zod) because the rules are data-driven from the categories package and cannot be statically expressed in a Zod schema.

---

## Testing Strategy

- **Unit tests** (`products.service.test.ts`): fake repository + fake storage; cover attribute validation for each category, draft vs active field differences, photo URL construction, subcategory/category mismatch
- **Integration tests** (`products.routes.test.ts`): real DB via `useTestDb()`, fake storage injected; cover full request → DB state for happy path and key error cases
- **No real R2 calls in any test** — fake storage returns predictable keys/URLs

---

## Out of Scope

- Admin approval endpoint (`PATCH /products/:id/approve`)
- `GET /products/:id` and listing endpoints
- `sold` status transition
- Product update/edit after creation
- R2 lifecycle rules for orphaned uploads (recommended: 1-day expiry on `products/uploads/` prefix in R2 console)
