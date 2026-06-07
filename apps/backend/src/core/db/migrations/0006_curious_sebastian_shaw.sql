ALTER TABLE "conversations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "otp_codes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "conversations" CASCADE;--> statement-breakpoint
DROP TABLE "messages" CASCADE;--> statement-breakpoint
DROP TABLE "otp_codes" CASCADE;--> statement-breakpoint
DROP TABLE "product_images" CASCADE;--> statement-breakpoint
DROP TABLE "products" CASCADE;--> statement-breakpoint
DROP TABLE "saved_products" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bubble_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_bubble_id_unique" UNIQUE("bubble_id");--> statement-breakpoint
DROP TYPE "public"."approval_status";--> statement-breakpoint
DROP TYPE "public"."listing_status";--> statement-breakpoint
DROP TYPE "public"."product_category";--> statement-breakpoint
DROP TYPE "public"."product_subcategory";