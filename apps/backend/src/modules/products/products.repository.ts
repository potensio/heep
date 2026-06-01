import { db } from '../../core/db/client';
import { products, productImages } from '../../core/db/schema';

export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;

export interface CreateProductRepoInput {
  sellerId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subcategory: string;
  attributes: Record<string, string | number>;
  listingStatus: 'draft' | 'active';
  approvalStatus: 'pending';
  expiresAt: Date | null;
  locationName: string;
  locationPlaceId: string;
  locationLat: number;
  locationLng: number;
  photos: { url: string; position: number }[];
}

export interface ProductsRepository {
  create(input: CreateProductRepoInput): Promise<{ product: Product; images: ProductImage[] }>;
}

export const productsRepository: ProductsRepository = {
  async create(input) {
    const { photos, ...productData } = input;
    return db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values(productData).returning();
      const images = await tx
        .insert(productImages)
        .values(photos.map(p => ({ productId: product.id, url: p.url, position: p.position })))
        .returning();
      return { product, images };
    });
  },
};
