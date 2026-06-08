import { z } from 'zod';

export const listConversationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  property_id: z.string().optional(),
  q: z.string().optional(),
});

export const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
