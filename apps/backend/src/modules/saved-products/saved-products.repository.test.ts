import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../core/db/client';
import { users, products, productImages, savedProducts } from '../../core/db/schema';
import { savedProductsRepository } from './saved-products.repository';

describe('savedProductsRepository', () => {
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    await db.delete(savedProducts);
    await db.delete(productImages);
    await db.delete(products);
    await db.delete(users);

    const [user] = await db.insert(users).values({ email: 'test@example.com' }).returning();
    userId = user.id;

    const [product] = await db.insert(products).values({
      sellerId: userId,
      name: 'Test Product',
      price: 100000,
      description: 'Test description',
      category: 'kendaraan',
      subcategory: 'mobil',
      listingStatus: 'active',
      approvalStatus: 'approved',
    }).returning();
    productId = product.id;

    await db.insert(productImages).values({
      productId,
      url: 'https://example.com/image.jpg',
      position: 0,
    });
  });

  describe('save', () => {
    it('creates a saved product record', async () => {
      const result = await savedProductsRepository.save(userId, productId);
      expect(result.userId).toBe(userId);
      expect(result.productId).toBe(productId);
    });

    it('throws on duplicate save', async () => {
      await savedProductsRepository.save(userId, productId);
      await expect(savedProductsRepository.save(userId, productId)).rejects.toThrow();
    });
  });

  describe('unsave', () => {
    it('removes a saved product record', async () => {
      await savedProductsRepository.save(userId, productId);
      await savedProductsRepository.unsave(userId, productId);
      const saved = await savedProductsRepository.isSaved(userId, productId);
      expect(saved).toBe(false);
    });
  });

  describe('isSaved', () => {
    it('returns true when saved', async () => {
      await savedProductsRepository.save(userId, productId);
      expect(await savedProductsRepository.isSaved(userId, productId)).toBe(true);
    });

    it('returns false when not saved', async () => {
      expect(await savedProductsRepository.isSaved(userId, productId)).toBe(false);
    });
  });

  describe('listByUser', () => {
    it('returns saved products ordered by savedAt desc', async () => {
      await savedProductsRepository.save(userId, productId);

      const [product2] = await db.insert(products).values({
        sellerId: userId,
        name: 'Second Product',
        price: 200000,
        description: 'Another product',
        category: 'handphone-tablet',
        subcategory: 'handphone',
        listingStatus: 'active',
        approvalStatus: 'approved',
      }).returning();

      await db.insert(productImages).values({
        productId: product2.id,
        url: 'https://example.com/image2.jpg',
        position: 0,
      });

      await new Promise(r => setTimeout(r, 10));
      await savedProductsRepository.save(userId, product2.id);

      const result = await savedProductsRepository.listByUser(userId);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Second Product');
      expect(result.nextCursor).toBeNull();
    });
  });
});
