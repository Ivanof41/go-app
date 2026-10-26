ALTER TABLE "sensor_stock" ALTER COLUMN "sensor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sensor_stock" ADD COLUMN "accessory_id" uuid;--> statement-breakpoint
ALTER TABLE "sensor_stock" ADD CONSTRAINT "sensor_stock_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_stock" ADD CONSTRAINT "sensor_stock_exactly_one_item" CHECK (("sensor_stock"."sensor_id" is not null) <> ("sensor_stock"."accessory_id" is not null));