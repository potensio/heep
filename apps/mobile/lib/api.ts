import type { Location } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;
  avatarUrl: string | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function requestOtp(email: string): Promise<void> {
  await post('/auth/otp/request', { email });
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; user: VerifiedUser }> {
  return post('/auth/otp/verify', { email, code });
}

export async function updateProfile(
  token: string,
  data: {
    name?: string;
    gender?: 'male' | 'female';
    avatarUrl?: string;
    phone?: string;
    location?: Location;
  },
): Promise<VerifiedUser> {
  const res = await fetch(`${BASE}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<VerifiedUser>;
}

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
  if (uploadUrl.includes('fake-r2.test')) return;
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
  if (uploads.length !== localPhotoUris.length) {
    throw new ApiError(500, 'Presign returned wrong number of URLs');
  }
  await Promise.all(
    localPhotoUris.map((uri, i) => uploadPhotoToR2(uri, uploads[i].uploadUrl)),
  );
  const photoKeys = uploads.map(u => u.key);
  const product = await createProduct(token, { ...productPayload, photos: photoKeys });
  return product.id;
}

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

// Saved Products API

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
  const res = await fetch(`${BASE}/saved-products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.saved === true;
}
