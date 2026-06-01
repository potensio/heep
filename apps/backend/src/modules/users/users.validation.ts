// src/modules/users/users.validation.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  gender: z.enum(['male', 'female']).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().min(5).max(20).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const sellerProductsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
