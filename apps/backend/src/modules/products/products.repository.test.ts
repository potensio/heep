import { describe, it, expect } from 'vitest';
import { testDb, useTestDb } from '../../core/test/db';
import { createUsersRepository } from '../users/users.repository';
import { createProductsRepository } from './products.repository';
import { products as productsTable } from '../../core/db/schema';
import { eq } from 'drizzle-orm';

useTestDb();

const usersRepository = createUsersRepository(testDb);
const productsRepository = createProductsRepository(testDb);

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

// Helper: create a product then flip it to active + approved directly in the DB.
async function createApproved(sellerId: string, overrides: Partial<typeof baseInput> = {}) {
  const { product } = await productsRepository.create({ sellerId, ...baseInput, ...overrides });
  await testDb
    .update(productsTable)
    .set({ listingStatus: 'active', approvalStatus: 'approved' })
    .where(eq(productsTable.id, product.id));
  return product;
}

describe('productsRepository.list', () => {
  it('returns empty when no approved active products exist', async () => {
    const user = await usersRepository.create({ email: 'list-empty@example.com' });
    await productsRepository.create({ sellerId: user.id, ...baseInput }); // pending, not returned
    const result = await productsRepository.list({});
    expect(result.rows).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it('returns active+approved products with seller and image', async () => {
    const user = await usersRepository.create({ email: 'list-ok@example.com' });
    const product = await createApproved(user.id);
    const result = await productsRepository.list({});
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(product.id);
    expect(result.rows[0].seller.id).toBe(user.id);
    expect(result.rows[0].firstImageUrl).toBe(
      'https://cdn.test.example.com/products/uploads/test-0.jpg',
    );
  });

  it('paginates: returns nextCursor when there are more results', async () => {
    const user = await usersRepository.create({ email: 'list-page@example.com' });
    await createApproved(user.id, { name: 'A' });
    await createApproved(user.id, { name: 'B' });
    await createApproved(user.id, { name: 'C' });

    const page1 = await productsRepository.list({ limit: 2 });
    expect(page1.rows).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await productsRepository.list({ limit: 2, cursor: page1.nextCursor! });
    expect(page2.rows).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();

    const allIds = [...page1.rows, ...page2.rows].map(r => r.id);
    expect(new Set(allIds).size).toBe(3);
  });

  it('filters by sellerId', async () => {
    const u1 = await usersRepository.create({ email: 'seller-a@example.com' });
    const u2 = await usersRepository.create({ email: 'seller-b@example.com' });
    await createApproved(u1.id, { name: 'A1' });
    await createApproved(u2.id, { name: 'B1' });
    const result = await productsRepository.list({ sellerId: u1.id });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].seller.id).toBe(u1.id);
  });

  it('filters by q (case-insensitive name match)', async () => {
    const user = await usersRepository.create({ email: 'list-q@example.com' });
    await createApproved(user.id, { name: 'Toyota Avanza 2020' });
    await createApproved(user.id, { name: 'Honda Jazz 2019' });
    const result = await productsRepository.list({ q: 'toyota' });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Toyota Avanza 2020');
  });

  it('sorts by price ascending (termurah)', async () => {
    const user = await usersRepository.create({ email: 'list-price@example.com' });
    await createApproved(user.id, { name: 'Expensive', price: 500_000_000 });
    await createApproved(user.id, { name: 'Cheap', price: 50_000_000 });
    const result = await productsRepository.list({ sortBy: 'termurah' });
    expect(result.rows[0].name).toBe('Cheap');
  });

  it('paginates price-sorted results without duplicates (termurah)', async () => {
    const user = await usersRepository.create({ email: 'price-page@example.com' });
    await createApproved(user.id, { name: 'Mid', price: 200_000_000 });
    await createApproved(user.id, { name: 'Cheap', price: 50_000_000 });
    await createApproved(user.id, { name: 'Expensive', price: 500_000_000 });

    const page1 = await productsRepository.list({ sortBy: 'termurah', limit: 2 });
    expect(page1.rows).toHaveLength(2);
    expect(page1.rows[0].name).toBe('Cheap');
    expect(page1.rows[1].name).toBe('Mid');
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await productsRepository.list({ sortBy: 'termurah', limit: 2, cursor: page1.nextCursor! });
    expect(page2.rows).toHaveLength(1);
    expect(page2.rows[0].name).toBe('Expensive');
    expect(page2.nextCursor).toBeNull();

    const allIds = [...page1.rows, ...page2.rows].map(r => r.id);
    expect(new Set(allIds).size).toBe(3);
  });
});

describe('productsRepository.findById', () => {
  it('returns null for unknown id', async () => {
    expect(await productsRepository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('returns null for pending product (not approved)', async () => {
    const user = await usersRepository.create({ email: 'pending-detail@example.com' });
    const { product } = await productsRepository.create({ sellerId: user.id, ...baseInput });
    // product is active but approvalStatus='pending' by default in baseInput
    expect(await productsRepository.findById(product.id)).toBeNull();
  });

  it('returns product with all photos and seller when active+approved', async () => {
    const user = await usersRepository.create({ email: 'approved-detail@example.com' });
    const product = await createApproved(user.id);
    const row = await productsRepository.findById(product.id);
    expect(row).not.toBeNull();
    expect(row!.id).toBe(product.id);
    expect(row!.seller.id).toBe(user.id);
    expect(row!.photos).toHaveLength(2);
    expect(row!.photos[0].position).toBe(0);
    expect(row!.photos[1].position).toBe(1);
    expect(row!.description).toBe('Kondisi baik');
    expect(row!.attributes).toMatchObject({ brand: 'Toyota' });
  });
});

describe('productsRepository.countForSeller', () => {
  it('returns 0 when seller has no active+approved listings', async () => {
    const user = await usersRepository.create({ email: 'count-zero@example.com' });
    await productsRepository.create({ sellerId: user.id, ...baseInput }); // pending
    expect(await productsRepository.countForSeller(user.id)).toBe(0);
  });

  it('counts only active+approved listings', async () => {
    const user = await usersRepository.create({ email: 'count-ok@example.com' });
    await createApproved(user.id);
    await createApproved(user.id);
    await productsRepository.create({ sellerId: user.id, ...baseInput }); // pending, not counted
    expect(await productsRepository.countForSeller(user.id)).toBe(2);
  });
});
