// src/modules/users/users.validation.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  gender: z.enum(['male', 'female']).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
