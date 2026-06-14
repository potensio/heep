import { z } from 'zod';

/** Comma-separated query param -> string[]. `?platform=WhatsApp,Instagram` */
const csv = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(',').map((v) => v.trim()).filter(Boolean) : undefined));

/** `?is_spam=true` -> true. Anything else / absent -> undefined (no filter). */
const trueFlag = z
  .string()
  .optional()
  .transform((v) => (v === 'true' ? true : undefined));

export const listConversationsSchema = z.object({
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  messages_limit: z.coerce.number().int().min(1).max(50).default(20),
  // Filters
  restaurant_id: z.string().optional(),
  platform: csv, // social_media: WhatsApp, Instagram, Messenger, ...
  priority: csv, // priority_status: High, Medium, Low
  tags: csv, // conversation_tags ids
  is_spam: trueFlag,
  is_archived: trueFlag,
  search: z.string().trim().min(1).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const listMessagesSchema = z.object({
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
