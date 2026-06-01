import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { testDb as db } from '../../core/test/db';
import { users, products, productImages, savedProducts } from '../../core/db/schema';
import { sentOtps } from '../../core/email';

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
    }, testEnv);
    const otpData = (await otpRes.json()) as { ok: boolean };
    expect(otpData.ok).toBe(true);

    const otp = sentOtps[0].code;

    // Verify OTP to get token
    const verifyRes = await app.request('/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', code: otp }),
    }, testEnv);
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
      }, testEnv);
      expect(res.status).toBe(201);
      const body = await res.json() as { productId: string };
      expect(body.productId).toBe(productId);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await app.request(`/saved-products/${productId}`, { method: 'POST' }, testEnv);
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /saved-products/:productId', () => {
    it('unsaves a product', async () => {
      await app.request(`/saved-products/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }, testEnv);
      const res = await app.request(`/saved-products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }, testEnv);
      expect(res.status).toBe(204);
    });
  });

  describe('GET /saved-products', () => {
    it('lists saved products', async () => {
      await app.request(`/saved-products/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }, testEnv);
      const res = await app.request('/saved-products', {
        headers: { Authorization: `Bearer ${token}` },
      }, testEnv);
      expect(res.status).toBe(200);
      const body = await res.json() as { items: { id: string }[] };
      expect(body.items).toHaveLength(1);
      expect(body.items[0].id).toBe(productId);
    });
  });
});
