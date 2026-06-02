import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { signAccessToken } from '../../core/jwt';
import { createUsersRepository } from '../users/users.repository';
import { testDb as db } from '../../core/test/db';
import { products as productsTable } from '../../core/db/schema';
import { eq } from 'drizzle-orm';
import { createProductsRepository } from './products.repository';

const usersRepository = createUsersRepository(db);
const productsRepository = createProductsRepository(db);

useTestDb();

const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: 'test-access-secret-16chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16ch',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  OTP_TTL: '300',
  OTP_MAX_ATTEMPTS: '5',
  EMAIL_FROM: 'test@example.com',
  WEB_ORIGIN: 'http://localhost:5173',
  CHAT_ROOM: {} as any,
};

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
    }, testEnv);
    expect(res.status).toBe(401);
  });

  it('returns presigned upload URLs', async () => {
    const user = await usersRepository.create({ email: 'presign@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products/images/presign', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 3 }),
    }, testEnv);
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
    }, testEnv);
    expect(res.status).toBe(400);
  });
});

describe('POST /products', () => {
  it('returns 401 without auth', async () => {
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    }, testEnv);
    expect(res.status).toBe(401);
  });

  it('creates an active product and returns 201', async () => {
    const user = await usersRepository.create({ email: 'create@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    }, testEnv);
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
    }, testEnv);
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
    }, testEnv);
    expect(res.status).toBe(400);
  });

  it('returns 400 for subcategory/category mismatch', async () => {
    const user = await usersRepository.create({ email: 'mismatch@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, subcategory: 'rumah' }),
    }, testEnv);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid photo key prefix', async () => {
    const user = await usersRepository.create({ email: 'badkey@example.com' });
    const token = await signAccessToken(user.id);
    const res = await createApp().request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, photos: ['../../etc/passwd'] }),
    }, testEnv);
    expect(res.status).toBe(400);
  });
});

const baseProductInput = {
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
  photos: [{ url: 'https://cdn.example.com/img.jpg', position: 0 }],
};

async function seedApproved(email: string, nameOverride?: string) {
  const user = await usersRepository.create({ email });
  const { product } = await productsRepository.create({
    sellerId: user.id,
    ...baseProductInput,
    ...(nameOverride ? { name: nameOverride } : {}),
  });
  await db.update(productsTable).set({ approvalStatus: 'approved' }).where(eq(productsTable.id, product.id));
  return { user, product };
}

describe('GET /products/feed', () => {
  it('returns empty items when no approved listings', async () => {
    const res = await createApp().request('/products/feed', {}, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(0);
    expect(body.nextCursor).toBeNull();
  });

  it('returns active+approved products with seller and photos', async () => {
    await seedApproved('feed-ok@example.com');
    const res = await createApp().request('/products/feed', {}, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0]).toHaveProperty('id');
    expect(body.items[0]).toHaveProperty('photos');
    expect(body.items[0]).toHaveProperty('seller');
  });

  it('paginates using limit and nextCursor', async () => {
    for (let i = 0; i < 3; i++) {
      await seedApproved(`feed-page-${i}@example.com`);
    }
    const page1 = await createApp().request('/products/feed?limit=2', {}, testEnv);
    expect(page1.status).toBe(200);
    const b1 = await page1.json() as any;
    expect(b1.items).toHaveLength(2);
    expect(b1.nextCursor).not.toBeNull();

    const page2 = await createApp().request(`/products/feed?limit=2&cursor=${encodeURIComponent(b1.nextCursor)}`, {}, testEnv);
    const b2 = await page2.json() as any;
    expect(b2.items).toHaveLength(1);
    expect(b2.nextCursor).toBeNull();
  });

  it('returns 400 for limit > 50', async () => {
    const res = await createApp().request('/products/feed?limit=99', {}, testEnv);
    expect(res.status).toBe(400);
  });
});

describe('GET /products/search', () => {
  it('filters by q (case-insensitive)', async () => {
    await seedApproved('search-toyota@example.com', 'Toyota Avanza 2020');
    await seedApproved('search-honda@example.com', 'Honda Jazz');
    const res = await createApp().request('/products/search?q=toyota', {}, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i: any) => i.name.toLowerCase().includes('toyota'))).toBe(true);
  });

  it('returns empty for non-matching q', async () => {
    await seedApproved('search-none@example.com');
    const res = await createApp().request('/products/search?q=zzznomatch', {}, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(0);
  });

  it('rejects invalid sortBy', async () => {
    const res = await createApp().request('/products/search?sortBy=invalid', {}, testEnv);
    expect(res.status).toBe(400);
  });
});

describe('GET /products/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await createApp().request('/products/00000000-0000-0000-0000-000000000000', {}, testEnv);
    expect(res.status).toBe(404);
  });

  it('returns product detail with photos and seller', async () => {
    const { product, user } = await seedApproved('detail-route@example.com');
    const res = await createApp().request(`/products/${product.id}`, {}, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.product.id).toBe(product.id);
    expect(Array.isArray(body.product.photos)).toBe(true);
    expect(body.product.seller.id).toBe(user.id);
    expect(body.product.description).toBeDefined();
  });
});

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
