import { CATEGORIES } from '@bantujual/categories';
import { NotFoundError, ValidationError } from '../../core/errors';
import { storageService, type StorageService } from '../../core/storage';
import {
  productsRepository,
  type ListFilters,
  type ProductDetailRow,
  type ProductListRow,
  type ProductsRepository,
} from './products.repository';
import type { CreateProductInput } from './products.validation';

export interface ProductsDeps {
  repo: ProductsRepository;
  storage: StorageService;
}

function validateCategoryAndAttributes(
  category: string,
  subcategory: string,
  attributes: Record<string, string | number>,
): void {
  const cat = CATEGORIES.find(c => c.id === category);
  if (!cat) throw new ValidationError(`Unknown category: ${category}`);

  const sub = cat.subcategories.find(s => s.id === subcategory);
  if (!sub) {
    throw new ValidationError(`Subcategory '${subcategory}' does not belong to category '${category}'`);
  }

  const allAttrs = [...cat.sharedAttributes, ...sub.attributes];
  const missing = allAttrs
    .filter(a => a.required)
    .filter(a => {
      const val = attributes[a.id];
      return val === undefined || val === '' || val === null;
    })
    .map(a => a.id);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required attributes: ${missing.join(', ')}`);
  }
}

function validatePhotoKeys(keys: string[]): void {
  const invalid = keys.filter(k => !k.startsWith('products/uploads/') || k.includes('..'));
  if (invalid.length > 0) throw new ValidationError('Invalid photo keys');
}

export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  photos: { url: string; position: number }[];
  category: string;
  subcategory: string;
  location: { name: string; lat: number; lng: number } | null;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
}

export interface ProductDetailItem extends ProductListItem {
  description: string;
  attributes: Record<string, string | number>;
  listingStatus: string;
  approvalStatus: string;
}

export interface PaginatedItems<T> {
  items: T[];
  nextCursor: string | null;
}

function toListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    photos: row.firstImageUrl ? [{ url: row.firstImageUrl, position: 0 }] : [],
    category: row.category,
    subcategory: row.subcategory,
    location:
      row.locationName != null && row.locationLat != null && row.locationLng != null
        ? { name: row.locationName, lat: row.locationLat, lng: row.locationLng }
        : null,
    seller: row.seller,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetailItem(row: ProductDetailRow): ProductDetailItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    photos: row.photos,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    attributes: row.attributes,
    listingStatus: row.listingStatus,
    approvalStatus: row.approvalStatus,
    location:
      row.locationName != null && row.locationLat != null && row.locationLng != null
        ? { name: row.locationName, lat: row.locationLat, lng: row.locationLng }
        : null,
    seller: row.seller,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ProductWithImages {
  product: import('./products.repository').Product;
  images: import('./products.repository').ProductImage[];
}

export function createProductsService(deps: ProductsDeps) {
  const { repo, storage } = deps;

  return {
    async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
      return storage.presignUpload(count);
    },

    async createProduct(sellerId: string, input: CreateProductInput): Promise<ProductWithImages> {
      validateCategoryAndAttributes(input.category, input.subcategory, input.attributes);
      validatePhotoKeys(input.photos);

      const photos = input.photos.map((key, position) => ({
        url: storage.keyToPublicUrl(key),
        position,
      }));

      const expiresAt =
        input.listingStatus === 'active'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null;

      return repo.create({
        sellerId,
        name: input.name,
        price: input.price,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory,
        attributes: input.attributes,
        listingStatus: input.listingStatus,
        approvalStatus: 'pending',
        expiresAt,
        locationName: input.location.name,
        locationPlaceId: input.location.placeId,
        locationLat: input.location.lat,
        locationLng: input.location.lng,
        photos,
      });
    },

    async listFeed(input: {
      cursor?: string;
      limit?: number;
      sellerId?: string;
    }): Promise<PaginatedItems<ProductListItem>> {
      const { rows, nextCursor } = await repo.list({
        sortBy: 'terbaru',
        cursor: input.cursor,
        limit: input.limit,
        sellerId: input.sellerId,
      });
      return { items: rows.map(toListItem), nextCursor };
    },

    async searchProducts(input: ListFilters): Promise<PaginatedItems<ProductListItem>> {
      const { rows, nextCursor } = await repo.list(input);
      return { items: rows.map(toListItem), nextCursor };
    },

    async getProduct(id: string): Promise<ProductDetailItem> {
      const row = await repo.findById(id);
      if (!row) throw new NotFoundError('Product not found');
      return toDetailItem(row);
    },
  };
}

export type ProductsService = ReturnType<typeof createProductsService>;

export const productsService = createProductsService({
  repo: productsRepository,
  storage: storageService,
});
