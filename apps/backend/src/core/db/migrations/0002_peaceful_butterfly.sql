CREATE TYPE "public"."product_subcategory" AS ENUM('mobil', 'motor', 'rumah', 'tanah', 'apartemen', 'kantor', 'ruko', 'handphone', 'tablet', 'aksesoris-gadget');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "subcategory" "product_subcategory" NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_subcategory_idx" ON "products" USING btree ("subcategory");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_attributes_idx" ON "products" USING gin ("attributes");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "condition";--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."product_category";--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('kendaraan', 'properti', 'handphone-tablet');--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "category" SET DATA TYPE "public"."product_category" USING "category"::"public"."product_category";