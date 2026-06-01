import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { db } from '../../core/db/client';
import { users, products, productImages, savedProducts } from '../../core/db/schema';
import { sentOtps } from '../../core/email';

useTestDb();

describe('saved-products routes', () => {
  let token: string;
  let userId: string;
  let productId: string;
  const app = createApp();

  beforeEach(async () => {
    sentOtps.length = 0;

    // Create user
    const [user] = await db.insert(users).values({ email: 'test@example.com' }).returning();
    userId = user.id;

    // Request OTP
    const otpRes = await app.request('/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const otpData = (await otpRes.json()) as { ok: boolean };
    expect(otpData.ok).toBe(true);

    const otp = sentOtps[0].code;

    // Verify OTP to get token
    const verifyRes = await app.request('/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', code: otp }),
    });
    const verifyData = (await verifyRes.json()) as { accessToken: string };
    token = verifyData.accessToken;

    // Create a product
    const [product] = await db.insert(products).values({
      sellerId: userId,
      name: 'Test Product',
      price: 100000,
      description: 'desc',
      category: 'kendaraan',
      subcategory: 'mobil',
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
      const body = await res.json() as { productId: string };
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
      const body = await res.json() as { items: { id: string }[] };
      expect(body.items).toHaveLength(1);
      expect(body.items[0].id).toBe(productId);
    });
  });
});
