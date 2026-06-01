import { and, asc, desc, eq, gt, gte, ilike, inArray, lt, lte, or, sql } from 'drizzle-orm';
import { db } from '../../core/db/client';
import { productImages, products, users } from '../../core/db/schema';

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
  approvalStatus: 'pending' | 'approved';
  expiresAt: Date | null;
  locationName: string;
  locationPlaceId: string;
  locationLat: number;
  locationLng: number;
  photos: { url: string; position: number }[];
}

export interface ListFilters {
  cursor?: string;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'terbaru' | 'termurah' | 'termahal';
  q?: string;
  sellerId?: string;
}

export interface ProductListRow {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: Date;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  firstImageUrl: string | null;
}

export interface ProductDetailRow {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subcategory: string;
  attributes: Record<string, string | number>;
  listingStatus: string;
  approvalStatus: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: Date;
  seller: { id: string; name: string | null; avatarUrl: string | null };
  photos: { url: string; position: number }[];
}

type DateCursor = { t: 'd'; v: string };
type PriceCursor = { t: 'p'; price: number; id: string };
type Cursor = DateCursor | PriceCursor;

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string): Cursor | null {
  try {
    return JSON.parse(Buffer.from(s, 'base64url').toString()) as Cursor;
  } catch {
    return null;
  }
}

export interface ProductsRepository {
  create(input: CreateProductRepoInput): Promise<{ product: Product; images: ProductImage[] }>;
  list(filters: ListFilters): Promise<{ rows: ProductListRow[]; nextCursor: string | null }>;
  findById(id: string): Promise<ProductDetailRow | null>;
  countForSeller(sellerId: string): Promise<number>;
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

  async list(filters) {
    const limit = Math.min(filters.limit ?? 20, 50);
    const sortBy = filters.sortBy ?? 'terbaru';

    const where = [
      eq(products.listingStatus, 'active'),
      eq(products.approvalStatus, 'approved'),
    ];

    if (filters.sellerId) where.push(eq(products.sellerId, filters.sellerId));
    if (filters.category) where.push(eq(products.category, filters.category as never));
    if (filters.minPrice !== undefined) where.push(gte(products.price, filters.minPrice));
    if (filters.maxPrice !== undefined) where.push(lte(products.price, filters.maxPrice));
    if (filters.q) where.push(ilike(products.name, `%${filters.q}%`));

    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      if (cursor) {
        if (cursor.t === 'd') {
          where.push(lt(products.createdAt, new Date(cursor.v)));
        } else if (sortBy === 'termurah') {
          where.push(
            or(
              gt(products.price, cursor.price),
              and(eq(products.price, cursor.price), gt(products.id, cursor.id)),
            )!,
          );
        } else if (sortBy === 'termahal') {
          where.push(
            or(
              lt(products.price, cursor.price),
              and(eq(products.price, cursor.price), lt(products.id, cursor.id)),
            )!,
          );
        }
      }
    }

    const orderBy =
      sortBy === 'termurah'
        ? [asc(products.price), asc(products.id)]
        : sortBy === 'termahal'
          ? [desc(products.price), desc(products.id)]
          : [desc(products.createdAt)];

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        category: products.category,
        subcategory: products.subcategory,
        locationName: products.locationName,
        locationLat: products.locationLat,
        locationLng: products.locationLng,
        createdAt: products.createdAt,
        sellerId: users.id,
        sellerName: users.name,
        sellerAvatarUrl: users.avatarUrl,
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(and(...where))
      .orderBy(...orderBy)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    if (slice.length === 0) return { rows: [], nextCursor: null };

    const ids = slice.map(r => r.id);
    const imageRows = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(and(inArray(productImages.productId, ids), eq(productImages.position, 0)));

    const imageMap = new Map(imageRows.map(i => [i.productId, i.url]));

    const last = slice[slice.length - 1];
    const nextCursor = hasMore
      ? sortBy === 'terbaru'
        ? encodeCursor({ t: 'd', v: last.createdAt.toISOString() })
        : encodeCursor({ t: 'p', price: last.price, id: last.id })
      : null;

    return {
      rows: slice.map(r => ({
        id: r.id,
        name: r.name,
        price: r.price,
        category: r.category,
        subcategory: r.subcategory,
        locationName: r.locationName,
        locationLat: r.locationLat,
        locationLng: r.locationLng,
        createdAt: r.createdAt,
        seller: { id: r.sellerId, name: r.sellerName, avatarUrl: r.sellerAvatarUrl },
        firstImageUrl: imageMap.get(r.id) ?? null,
      })),
      nextCursor,
    };
  },

  async findById(id) {
    const [row] = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        description: products.description,
        category: products.category,
        subcategory: products.subcategory,
        attributes: products.attributes,
        listingStatus: products.listingStatus,
        approvalStatus: products.approvalStatus,
        locationName: products.locationName,
        locationLat: products.locationLat,
        locationLng: products.locationLng,
        createdAt: products.createdAt,
        sellerId: users.id,
        sellerName: users.name,
        sellerAvatarUrl: users.avatarUrl,
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!row) return null;

    const photos = await db
      .select({ url: productImages.url, position: productImages.position })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position));

    return {
      id: row.id,
      name: row.name,
      price: row.price,
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      attributes: row.attributes as Record<string, string | number>,
      listingStatus: row.listingStatus,
      approvalStatus: row.approvalStatus,
      locationName: row.locationName,
      locationLat: row.locationLat,
      locationLng: row.locationLng,
      createdAt: row.createdAt,
      seller: { id: row.sellerId, name: row.sellerName, avatarUrl: row.sellerAvatarUrl },
      photos,
    };
  },

  async countForSeller(sellerId) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.sellerId, sellerId),
          eq(products.listingStatus, 'active'),
          eq(products.approvalStatus, 'approved'),
        ),
      );
    return row?.count ?? 0;
  },
};
