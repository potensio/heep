import { describe, it, expect } from 'vitest';
import { createProductsService } from './products.service';
import { FakeStorageService } from '../../core/storage';
import type { ProductsRepository, Product, ProductImage, CreateProductRepoInput, ProductListRow, ProductDetailRow } from './products.repository';

const stubProduct: Product = {
  id: 'prod-uuid',
  sellerId: 'user-uuid',
  name: 'Test',
  price: 150_000_000,
  description: '',
  category: 'kendaraan',
  subcategory: 'mobil',
  attributes: {},
  listingStatus: 'active',
  approvalStatus: 'pending',
  expiresAt: new Date(),
  locationName: 'Jakarta',
  locationPlaceId: 'place123',
  locationLat: -6.2,
  locationLng: 106.8,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const stubImage: ProductImage = {
  id: 'img-uuid',
  productId: 'prod-uuid',
  url: 'https://cdn.test.example.com/products/uploads/test-0.jpg',
  position: 0,
};

function makeFakeRepo(): { repo: ProductsRepository; getLastInput: () => CreateProductRepoInput | null } {
  let captured: CreateProductRepoInput | null = null;
  return {
    repo: {
      async create(input) {
        captured = input;
        return { product: { ...stubProduct } as Product, images: [stubImage] };
      },
      async list() { return { rows: [], nextCursor: null }; },
      async findById() { return null; },
      async countForSeller() { return 0; },
      async update() { return { product: { ...stubProduct } as Product, images: [stubImage] }; },
      async findByIdForEdit() { return null; },
    },
    getLastInput: () => captured,
  };
}

const fakeStorage = new FakeStorageService();

const validInput = {
  name: 'Toyota Avanza',
  price: 150_000_000,
  description: '',
  category: 'kendaraan' as const,
  subcategory: 'mobil' as const,
  attributes: { brand: 'Toyota', condition: 'Bekas', year: 2020, mileage: 30000, fuel: 'Bensin' },
  location: { name: 'Jakarta Selatan', placeId: 'p123', lat: -6.2, lng: 106.8 },
  photos: ['products/uploads/test-0.jpg'],
  listingStatus: 'active' as const,
};

describe('createProductsService', () => {
  it('throws ValidationError when subcategory does not belong to category', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', { ...validInput, subcategory: 'rumah' as any }),
    ).rejects.toThrow("Subcategory 'rumah' does not belong to category 'kendaraan'");
  });

  it('throws ValidationError when required attributes are missing', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', { ...validInput, attributes: {} }),
    ).rejects.toThrow('Missing required attributes');
  });

  it('throws ValidationError when photo key has wrong prefix', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', { ...validInput, photos: ['../../etc/passwd'] }),
    ).rejects.toThrow('Invalid photo keys');
  });

  it('converts photo keys to public URLs', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.createProduct('user-uuid', validInput);
    const last = getLastInput()!;
    expect(last.photos[0].url).toBe('https://cdn.test.example.com/products/uploads/test-0.jpg');
    expect(last.photos[0].position).toBe(0);
  });

  it('sets expiresAt ~30 days from now for active listings', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    const before = Date.now();
    await service.createProduct('user-uuid', { ...validInput, listingStatus: 'active' });
    const expiresAt = getLastInput()!.expiresAt!;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAt).not.toBeNull();
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + thirtyDays - 2000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(before + thirtyDays + 2000);
  });

  it('sets expiresAt null for draft listings', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.createProduct('user-uuid', { ...validInput, listingStatus: 'draft' });
    expect(getLastInput()!.expiresAt).toBeNull();
  });

  it('always sets approvalStatus to pending', async () => {
    const { repo, getLastInput } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await service.createProduct('user-uuid', validInput);
    expect(getLastInput()!.approvalStatus).toBe('pending');
  });

  it('presignUpload delegates to storage service', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    const uploads = await service.presignUpload(2);
    expect(uploads).toHaveLength(2);
    expect(uploads[0]).toHaveProperty('uploadUrl');
    expect(uploads[0]).toHaveProperty('key');
  });

  it('validates aksesoris-gadget (no required attributes beyond condition)', async () => {
    const { repo } = makeFakeRepo();
    const service = createProductsService({ repo, storage: fakeStorage });
    await expect(
      service.createProduct('user-uuid', {
        ...validInput,
        category: 'handphone-tablet',
        subcategory: 'aksesoris-gadget',
        attributes: { condition: 'Baru' },
      }),
    ).resolves.toBeDefined();
  });
});

const stubListRow: ProductListRow = {
  id: 'prod-1',
  name: 'Avanza',
  price: 150_000_000,
  category: 'kendaraan',
  subcategory: 'mobil',
  locationName: 'Jakarta',
  locationLat: -6.2,
  locationLng: 106.8,
  createdAt: new Date('2024-01-01'),
  seller: { id: 'seller-1', name: 'Andi', avatarUrl: null },
  firstImageUrl: 'https://cdn.example.com/img.jpg',
};

const stubDetailRow: ProductDetailRow = {
  id: 'prod-1',
  name: 'Avanza',
  price: 150_000_000,
  description: 'Kondisi baik',
  category: 'kendaraan',
  subcategory: 'mobil',
  attributes: { brand: 'Toyota' },
  listingStatus: 'active',
  approvalStatus: 'approved',
  locationName: 'Jakarta',
  locationPlaceId: 'ChIJnUvjRenzaS4RmA3vxiiGRiY',
  locationLat: -6.2,
  locationLng: 106.8,
  createdAt: new Date('2024-01-01'),
  seller: { id: 'seller-1', name: 'Andi', avatarUrl: null },
  photos: [{ url: 'https://cdn.example.com/img.jpg', position: 0 }],
};

describe('createProductsService — read methods', () => {
  function makeReadRepo() {
    const base = makeFakeRepo();
    return {
      ...base,
      repo: {
        ...base.repo,
        async list(_filters: unknown) { return { rows: [stubListRow], nextCursor: null }; },
        async findById(id: string) { return id === 'prod-1' ? stubDetailRow : null; },
        async countForSeller(_id: string) { return 0; },
      },
    };
  }

  it('listFeed maps ProductListRow to ProductListItem shape', async () => {
    const { repo } = makeReadRepo();
    const svc = createProductsService({ repo, storage: fakeStorage });
    const result = await svc.listFeed({});
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('prod-1');
    expect(result.items[0].photos).toEqual([{ url: 'https://cdn.example.com/img.jpg', position: 0 }]);
    expect(result.items[0].location).toEqual({ name: 'Jakarta', lat: -6.2, lng: 106.8 });
    expect(result.nextCursor).toBeNull();
  });

  it('searchProducts passes filters through to repo.list', async () => {
    let capturedFilters: unknown = null;
    const { repo } = makeReadRepo();
    const spyRepo = { ...repo, async list(f: unknown) { capturedFilters = f; return { rows: [], nextCursor: null }; } };
    const svc = createProductsService({ repo: spyRepo, storage: fakeStorage });
    await svc.searchProducts({ q: 'avanza', sortBy: 'termurah' });
    expect(capturedFilters).toMatchObject({ q: 'avanza', sortBy: 'termurah' });
  });

  it('getProduct returns ProductDetailItem for known id', async () => {
    const { repo } = makeReadRepo();
    const svc = createProductsService({ repo, storage: fakeStorage });
    const item = await svc.getProduct('prod-1');
    expect(item.id).toBe('prod-1');
    expect(item.description).toBe('Kondisi baik');
    expect(item.photos).toHaveLength(1);
  });

  it('getProduct throws NotFoundError for unknown id', async () => {
    const { repo } = makeReadRepo();
    const svc = createProductsService({ repo, storage: fakeStorage });
    await expect(svc.getProduct('unknown')).rejects.toMatchObject({ status: 404 });
  });
});
