import { and, desc, eq, lt, inArray } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { savedProducts, products, productImages, users } from '../../core/db/schema';

export interface SavedProductRow {
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
  savedAt: Date;
}

type ListCursor = { savedAt: string; id: string };

function encodeCursor(c: ListCursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string): ListCursor | null {
  try {
    const c = JSON.parse(Buffer.from(s, 'base64url').toString());
    if (typeof c?.savedAt !== 'string') return null;
    return c as ListCursor;
  } catch {
    return null;
  }
}

export interface SavedProductsRepository {
  save(userId: string, productId: string): Promise<{ userId: string; productId: string; createdAt: Date }>;
  unsave(userId: string, productId: string): Promise<void>;
  isSaved(userId: string, productId: string): Promise<boolean>;
  listByUser(userId: string, cursor?: string, limit?: number): Promise<{ items: SavedProductRow[]; nextCursor: string | null }>;
}

export function createSavedProductsRepository(db: Database): SavedProductsRepository {
  return {
    async save(userId, productId) {
      const [row] = await db.insert(savedProducts).values({ userId, productId }).returning();
      return { userId: row.userId, productId: row.productId, createdAt: row.createdAt };
    },

    async unsave(userId, productId) {
      await db.delete(savedProducts).where(and(eq(savedProducts.userId, userId), eq(savedProducts.productId, productId)));
    },

    async isSaved(userId, productId) {
      const [row] = await db
        .select({ id: savedProducts.productId })
        .from(savedProducts)
        .where(and(eq(savedProducts.userId, userId), eq(savedProducts.productId, productId)))
        .limit(1);
      return !!row;
    },

    async listByUser(userId, cursor, limit = 20) {
      const actualLimit = Math.min(limit, 50);
      const where = [eq(savedProducts.userId, userId)];

      if (cursor) {
        const c = decodeCursor(cursor);
        if (c) where.push(lt(savedProducts.createdAt, new Date(c.savedAt)));
      }

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
          savedAt: savedProducts.createdAt,
        })
        .from(savedProducts)
        .innerJoin(products, eq(savedProducts.productId, products.id))
        .innerJoin(users, eq(products.sellerId, users.id))
        .where(and(...where))
        .orderBy(desc(savedProducts.createdAt))
        .limit(actualLimit + 1);

      const hasMore = rows.length > actualLimit;
      const slice = hasMore ? rows.slice(0, actualLimit) : rows;

      if (slice.length === 0) return { items: [], nextCursor: null };

      const ids = slice.map(r => r.id);
      const imageRows = await db
        .select({ productId: productImages.productId, url: productImages.url })
        .from(productImages)
        .where(and(inArray(productImages.productId, ids), eq(productImages.position, 0)));

      const imageMap = new Map(imageRows.map(i => [i.productId, i.url]));
      const last = slice[slice.length - 1];
      const nextCursor = hasMore ? encodeCursor({ savedAt: last.savedAt.toISOString(), id: last.id }) : null;

      return {
        items: slice.map(r => ({
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
          savedAt: r.savedAt,
        })),
        nextCursor,
      };
    },
  };
}
