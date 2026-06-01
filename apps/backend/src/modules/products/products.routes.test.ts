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
