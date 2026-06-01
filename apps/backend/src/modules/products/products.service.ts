import { CATEGORIES } from '@bantujual/categories';
import { ValidationError } from '../../core/errors';
import { storageService, type StorageService } from '../../core/storage';
import {
  productsRepository,
  type ProductsRepository,
  type Product,
  type ProductImage,
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

export interface ProductWithImages {
  product: Product;
  images: ProductImage[];
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

      const expiresAt = input.listingStatus === 'active'
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
  };
}

export type ProductsService = ReturnType<typeof createProductsService>;

export const productsService = createProductsService({
  repo: productsRepository,
  storage: storageService,
});
