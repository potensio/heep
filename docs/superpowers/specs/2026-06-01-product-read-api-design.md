# Product Read API Design

**Date:** 2026-06-01  
**Status:** Approved

## Problem

The mobile frontend (HomeScreen, SearchProductsScreen, ProductDetailScreen, SellerProfileScreen) is entirely driven by hardcoded `mockProducts` and `mockSellers`. The backend already has product creation (`POST /products`) and image presigning, but no read endpoints. This spec covers the read layer needed to replace mock data with real API calls.

## Decisions

- Feed shows only `listingStatus = 'active'` AND `approvalStatus = 'approved'`
- Listings are approved manually in the DB for now; no admin endpoint in this scope
- Cursor-based pagination (`createdAt DESC`) for infinite scroll on all list endpoints
- Home feed and search are separate routes so the feed can adopt a ranking algorithm later without coupling to search
- Rating and response time are not in scope — seller profile shows name, avatar, joined date, and active listing count only
- Mobile `Product` type shape stays as-is; hooks normalize API responses to keep call sites untouched

---

## Backend

### New endpoints

#### `GET /products/feed`

Returns the most recent active+approved listings. No auth required.

Query params:
- `cursor` — ISO timestamp of the last item from the previous page (omit for first page)
- `limit` — default 20, max 50

Response:
```json
{
  "items": [ ProductListItem ],
  "nextCursor": "<ISO string> | null"
}
```

#### `GET /products/search`

Returns active+approved listings filtered by the provided params. No auth required.

Query params:
- `q` — case-insensitive `ILIKE %q%` on product name (optional)
- `category` — category id (optional)
- `minPrice` — integer (optional)
- `maxPrice` — integer (optional)
- `sortBy` — `terbaru` (default, `createdAt DESC`), `termurah` (`price ASC`), `termahal` (`price DESC`)
- `cursor` — ISO timestamp for next-page cursor
- `limit` — default 20, max 50

Response: same envelope as feed.

#### `GET /products/:id`

Returns full product detail with all photos and embedded seller. No auth required. Returns 404 if not found.

Response:
```json
{
  "product": ProductDetail
}
```

### Extended endpoint

#### `GET /users/:id`

Existing endpoint. Extended to also return `createdAt` and `activeListingCount` (count of `listingStatus = 'active'` AND `approvalStatus = 'approved'` rows for this seller).

Response:
```json
{
  "id": "...",
  "name": "...",
  "avatarUrl": "...",
  "createdAt": "<ISO>",
  "activeListingCount": 5
}
```

#### `GET /users/:id/products`

Returns the seller's active+approved listings. No auth required. Same paginated envelope as feed.

Query params: `cursor`, `limit` (same defaults as feed).

---

### Response types

```ts
interface ProductListItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];  // sorted by position, at least one
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
}

interface ProductDetail extends ProductListItem {
  description: string;
  attributes: Record<string, string | number>;
  listingStatus: string;
  approvalStatus: string;
}

interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
```

### Implementation structure

Follows the existing pattern: `validation → routes → service → repository`.

**products.validation.ts** — add `feedQuerySchema`, `searchQuerySchema`, `productIdParamSchema`.

**products.repository.ts** — add:
- `list(filters: ListFilters): Promise<{ rows: ProductWithSeller[]; nextCursor: string | null }>` — used by both feed and search. Always filters `active + approved`. Joins `productImages` (first image by position) and `users` (seller name + avatarUrl). Cursor is `WHERE created_at < :cursor`.
- `findById(id: string): Promise<ProductWithImages | null>` — joins all images and seller.

**products.service.ts** — add `listFeed()`, `searchProducts()`, `getProduct()` methods. Service enforces the `active + approved` invariant so routes can't bypass it.

**users.repository.ts** — extend `findById` result to include `activeListingCount` (a correlated count subquery or a separate count query in the service).

**users.service.ts** — extend `getById` to attach `createdAt` and `activeListingCount`.

---

## Mobile

No new screens. Four screens are rewired from mock data to real API hooks.

### New API functions (`lib/api.ts`)

```ts
fetchFeed(cursor?: string, limit?: number): Promise<Paginated<ProductListItem>>
fetchSearch(params: SearchParams, cursor?: string): Promise<Paginated<ProductListItem>>
fetchProduct(id: string): Promise<ProductDetail>
fetchSellerProducts(sellerId: string, cursor?: string): Promise<Paginated<ProductListItem>>
```

All use a shared `get<T>(path, token?)` helper (unauthenticated GET, mirrors existing `post`/`authPost` helpers).

### New hooks

Each hook lives in the relevant feature folder:

| Hook | Location | Replaces |
|---|---|---|
| `useProductFeed()` | `features/home/hooks/useProductFeed.ts` | `mockProducts` in HomeScreen |
| `useProductSearch(query, filters)` | `features/search/hooks/useProductSearch.ts` | client-side filter in SearchProductsScreen |
| `useProduct(id)` | `features/product/hooks/useProduct.ts` | `mockProducts.find()` in ProductDetailScreen |
| `useSellerProducts(sellerId)` | `features/seller/hooks/useSellerProducts.ts` | `mockSellers[id].products` in SellerProfileScreen |

Hook interface (all list hooks):
```ts
{
  data: Product[];       // normalized to existing Product shape
  isLoading: boolean;
  error: Error | null;
  fetchMore: () => void; // triggers next cursor page
  hasMore: boolean;
  refetch: () => void;
}
```

`useProduct(id)`:
```ts
{
  data: ProductDetail | null;
  isLoading: boolean;
  error: Error | null;
}
```

### Normalization

List hooks normalize `ProductListItem` to the existing `Product` shape so `ProductCard` call sites don't change:
```ts
image: photos[0]?.url ?? ''
seller: seller.name ?? ''
sellerId: seller.id
```

### Error states

- Network/server error → `error` state set, existing rendered data preserved
- `fetchMore` failure → silent, `hasMore` stays true, retried on next scroll
- 404 from `fetchProduct` → ProductDetailScreen shows "Produk tidak ditemukan"
- Empty feed/search → existing `EmptyState` component shown

---

## Out of scope

- Admin approval UI or endpoint
- Rating, response time on seller profile
- Product editing or deletion
- Location-based feed ranking (feed endpoint is positioned to support this later)
