import { savedProductsRepository, type SavedProductRow } from './saved-products.repository';

export interface SavedProductItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
  savedAt: string;
}

export interface SavedProductsListResult {
  items: SavedProductItem[];
  nextCursor: string | null;
}

function mapToApi(row: SavedProductRow): SavedProductItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    photos: row.firstImageUrl ? [{ url: row.firstImageUrl, position: 0 }] : [],
    category: row.category,
    subcategory: row.subcategory,
    location: row.locationName ? { name: row.locationName, lat: row.locationLat!, lng: row.locationLng! } : null,
    seller: row.seller,
    createdAt: row.createdAt.toISOString(),
    savedAt: row.savedAt.toISOString(),
  };
}

export const savedProductsService = {
  async saveProduct(userId: string, productId: string) {
    return savedProductsRepository.save(userId, productId);
  },

  async unsaveProduct(userId: string, productId: string) {
    await savedProductsRepository.unsave(userId, productId);
  },

  async isSaved(userId: string, productId: string) {
    return savedProductsRepository.isSaved(userId, productId);
  },

  async listSavedProducts(userId: string, cursor?: string, limit?: number): Promise<SavedProductsListResult> {
    const { items, nextCursor } = await savedProductsRepository.listByUser(userId, cursor, limit);
    return { items: items.map(mapToApi), nextCursor };
  },
};
