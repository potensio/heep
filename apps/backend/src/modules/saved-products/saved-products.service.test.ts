import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSavedProductsService } from './saved-products.service';
import type { SavedProductsRepository } from './saved-products.repository';

const mockRepo: SavedProductsRepository = {
  save: vi.fn(),
  unsave: vi.fn(),
  isSaved: vi.fn(),
  listByUser: vi.fn(),
};

const savedProductsService = createSavedProductsService({ repo: mockRepo });

describe('savedProductsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('saveProduct', () => {
    it('calls repository save', async () => {
      vi.mocked(mockRepo.save).mockResolvedValueOnce({
        userId: 'user-1', productId: 'product-1', createdAt: new Date(),
      });
      const result = await savedProductsService.saveProduct('user-1', 'product-1');
      expect(mockRepo.save).toHaveBeenCalledWith('user-1', 'product-1');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('unsaveProduct', () => {
    it('calls repository unsave', async () => {
      vi.mocked(mockRepo.unsave).mockResolvedValueOnce(undefined);
      await savedProductsService.unsaveProduct('user-1', 'product-1');
      expect(mockRepo.unsave).toHaveBeenCalledWith('user-1', 'product-1');
    });
  });

  describe('isSaved', () => {
    it('delegates to repository', async () => {
      vi.mocked(mockRepo.isSaved).mockResolvedValueOnce(true);
      expect(await savedProductsService.isSaved('user-1', 'product-1')).toBe(true);
    });
  });

  describe('listSavedProducts', () => {
    it('maps repository result to API response', async () => {
      vi.mocked(mockRepo.listByUser).mockResolvedValueOnce({
        items: [{
          id: 'product-1', name: 'Test', price: 100000, category: 'fashion', subcategory: 'kaos',
          locationName: 'Jakarta', locationLat: -6.2, locationLng: 106.8,
          createdAt: new Date('2024-01-01'),
          seller: { id: 's1', name: 'Seller', avatarUrl: null },
          firstImageUrl: 'https://example.com/img.jpg',
          savedAt: new Date('2024-01-02'),
        }],
        nextCursor: null,
      });
      const result = await savedProductsService.listSavedProducts('user-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].photos[0].url).toBe('https://example.com/img.jpg');
    });
  });
});
