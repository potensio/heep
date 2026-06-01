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

  it('rolls back if product insert fails (invalid sellerId)', async () => {
    await expect(
      productsRepository.create({ ...baseInput, sellerId: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toThrow();
  });
});
