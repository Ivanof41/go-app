ALTER TABLE "sensors" ALTER COLUMN "brand_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sensors" ALTER COLUMN "technology_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sensors" ALTER COLUMN "provider_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sensors" ALTER COLUMN "purchase_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sensors" ALTER COLUMN "sale_price" DROP NOT NULL;