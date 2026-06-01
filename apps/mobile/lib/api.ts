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
