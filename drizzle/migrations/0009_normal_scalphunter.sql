ALTER TABLE "accessories" ADD COLUMN "type" varchar(60) DEFAULT 'otro' NOT NULL;--> statement-breakpoint
ALTER TABLE "accessories" ADD COLUMN "brand_id" uuid;--> statement-breakpoint
ALTER TABLE "accessories" ADD COLUMN "purchase_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "accessories" ADD COLUMN "sale_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;