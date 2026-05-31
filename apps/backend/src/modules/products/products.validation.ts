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
