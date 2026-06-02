import { z } from 'zod';
import { CATEGORIES } from '@bantujual/categories';

const categoryIds = CATEGORIES.map(c => c.id) as [string, ...string[]];
const subcategoryIds = CATEGORIES.flatMap(c => c.subcategories.map(s => s.id)) as [string, ...string[]];

export const presignSchema = z.object({
  count: z.number().int().min(1).max(6),
});

export const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().int().min(1000),
  description: z.string().max(500).optional().default(''),
  category: z.enum(categoryIds),
  subcategory: z.enum(subcategoryIds),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])),
  location: z.object({
    name: z.string().min(1),
    placeId: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  }),
  photos: z.array(z.string()).min(1).max(6),
  listingStatus: z.enum(['draft', 'active']),
});

export type PresignInput = z.infer<typeof presignSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().int().min(1000),
  description: z.string().max(500).optional().default(''),
  category: z.enum(categoryIds),
  subcategory: z.enum(subcategoryIds),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])),
  location: z.object({
    name: z.string().min(1),
    placeId: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  }),
  photos: z
    .array(
      z.string().refine(
        v => v.startsWith('https://') || (v.startsWith('products/uploads/') && !v.includes('..')),
        'Photo must be a public URL or a valid upload key',
      ),
    )
    .min(1)
    .max(6),
  listingStatus: z.enum(['draft', 'active']),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const searchQuerySchema = feedQuerySchema.extend({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['terbaru', 'termurah', 'termahal']).optional().default('terbaru'),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
