import { z } from 'zod';

export const listConversationsSchema = z.object({
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  messages_limit: z.coerce.number().int().min(1).max(50).default(20),
});
