// src/modules/users/users.routes.test.ts
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { signAccessToken } from '../../core/jwt';
import { usersRepository } from './users.repository';
import { db } from '../../core/db/client';
import { products as productsTable } from '../../core/db/schema';
import { eq } from 'drizzle-orm';
import { productsRepository } from '../products/products.repository';

useTestDb();

const baseProductForUsers = {
  name: 'Toyota Avanza',
  price: 150_000_000,
  description: 'Kondisi baik',
  category: 'kendaraan',
  subcategory: 'mobil',
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

async function createApprovedProductForUser(sellerId: string) {
  const { product } = await productsRepository.create({ sellerId, ...baseProductForUsers });
  await db.update(productsTable).set({ approvalStatus: 'approved' }).where(eq(productsTable.id, product.id));
  return product;
}

describe('users routes (integration)', () => {
  it('GET /users/:id returns a public profile', async () => {
    const u = await usersRepository.create({ email: 'pub@example.com' });
    await usersRepository.update(u.id, { name: 'Public Person' });
    const res = await createApp().request(`/users/${u.id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, name: 'Public Person' });
  });

  it('GET /users/:id returns 404 for unknown id', async () => {
    const res = await createApp().request('/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('GET /users/me requires auth', async () => {
    const res = await createApp().request('/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/me returns the authenticated user', async () => {
    const u = await usersRepository.create({ email: 'me@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, email: 'me@example.com' });
  });

  it('PATCH /users/me updates the profile and flips profileCompleted', async () => {
    const u = await usersRepository.create({ email: 'edit@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Edited', gender: 'male' }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: 'Edited', profileCompleted: true });
  });
});

describe('GET /users/:id — extended response', () => {
  it('includes createdAt and activeListingCount', async () => {
    const u = await usersRepository.create({ email: 'extended@example.com' });
    await createApprovedProductForUser(u.id);
    await createApprovedProductForUser(u.id);
    const res = await createApp().request(`/users/${u.id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(typeof body.createdAt).toBe('string');
    expect(body.activeListingCount).toBe(2);
  });

  it('returns 0 activeListingCount for new user', async () => {
    const u = await usersRepository.create({ email: 'zero-count@example.com' });
    const res = await createApp().request(`/users/${u.id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.activeListingCount).toBe(0);
  });
});

describe('GET /users/:id/products', () => {
  it('returns seller active+approved products', async () => {
    const u = await usersRepository.create({ email: 'seller-products@example.com' });
    await createApprovedProductForUser(u.id);
    const res = await createApp().request(`/users/${u.id}/products`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(1);
    expect(body.items[0].seller.id).toBe(u.id);
    expect(body.nextCursor).toBeNull();
  });

  it('returns empty items for seller with no approved listings', async () => {
    const u = await usersRepository.create({ email: 'no-products@example.com' });
    const res = await createApp().request(`/users/${u.id}/products`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toHaveLength(0);
  });
});
