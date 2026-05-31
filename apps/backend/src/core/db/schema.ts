import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, jsonb, index, doublePrecision,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { CATEGORIES } from '@bantujual/categories';

export const genderEnum = pgEnum('gender', ['male', 'female']);

const categoryIds = CATEGORIES.map(c => c.id) as [string, ...string[]];
export const productCategoryEnum = pgEnum('product_category', categoryIds);

const subcategoryIds = CATEGORIES.flatMap(c => c.subcategories.map(s => s.id)) as [string, ...string[]];
export const productSubcategoryEnum = pgEnum('product_subcategory', subcategoryIds);

export const listingStatusEnum = pgEnum('listing_status', ['draft', 'active', 'sold']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'rejected', 'approved']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  gender: genderEnum('gender'),
  profileCompleted: boolean('profile_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('otp_codes_email_idx').on(t.email)]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('refresh_tokens_user_id_idx').on(t.userId)]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description').notNull().default(''),
  category: productCategoryEnum('category').notNull(),
  subcategory: productSubcategoryEnum('subcategory').notNull(),
  attributes: jsonb('attributes').notNull().default({}),
  listingStatus: listingStatusEnum('listing_status').notNull().default('draft'),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  locationName: text('location_name'),
  locationPlaceId: text('location_place_id'),
  locationLat: doublePrecision('location_lat'),
  locationLng: doublePrecision('location_lng'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('products_seller_id_idx').on(t.sellerId),
  index('products_category_idx').on(t.category),
  index('products_subcategory_idx').on(t.subcategory),
  index('products_attributes_idx').using('gin', t.attributes),
]);

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
}, (t) => [index('product_images_product_id_idx').on(t.productId)]);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  imageUrl: text('image_url'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('messages_conversation_id_idx').on(t.conversationId)]);

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, { fields: [products.sellerId], references: [users.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  product: one(products, { fields: [conversations.productId], references: [products.id] }),
  buyer: one(users, { fields: [conversations.buyerId], references: [users.id] }),
  seller: one(users, { fields: [conversations.sellerId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));
