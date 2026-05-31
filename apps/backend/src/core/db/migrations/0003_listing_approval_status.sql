CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'sold');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'rejected', 'approved');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "listing_status" "listing_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "approval_status" "approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location_place_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location_lat" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location_lng" double precision;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
DROP TYPE "public"."product_status";--> statement-breakpoint
DROP TYPE "public"."product_condition";
