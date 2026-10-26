CREATE TABLE "montaje_item_accessories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"montaje_item_id" uuid NOT NULL,
	"accessory_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "montaje_item_accessories_quantity_positive" CHECK ("montaje_item_accessories"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "montaje_stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"montaje_id" uuid NOT NULL,
	"montaje_item_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"sensor_id" uuid,
	"accessory_id" uuid,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "montaje_stock_movements_exactly_one_item" CHECK (("montaje_stock_movements"."sensor_id" is not null) <> ("montaje_stock_movements"."accessory_id" is not null)),
	CONSTRAINT "montaje_stock_movements_quantity_positive" CHECK ("montaje_stock_movements"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "montajes" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "montajes" ADD COLUMN "stock_zone_id" uuid;--> statement-breakpoint
ALTER TABLE "montaje_item_accessories" ADD CONSTRAINT "montaje_item_accessories_montaje_item_id_montaje_items_id_fk" FOREIGN KEY ("montaje_item_id") REFERENCES "public"."montaje_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_item_accessories" ADD CONSTRAINT "montaje_item_accessories_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_stock_movements" ADD CONSTRAINT "montaje_stock_movements_montaje_id_montajes_id_fk" FOREIGN KEY ("montaje_id") REFERENCES "public"."montajes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_stock_movements" ADD CONSTRAINT "montaje_stock_movements_montaje_item_id_montaje_items_id_fk" FOREIGN KEY ("montaje_item_id") REFERENCES "public"."montaje_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_stock_movements" ADD CONSTRAINT "montaje_stock_movements_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_stock_movements" ADD CONSTRAINT "montaje_stock_movements_sensor_id_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_stock_movements" ADD CONSTRAINT "montaje_stock_movements_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "montaje_item_accessories_item_accessory_unique" ON "montaje_item_accessories" USING btree ("montaje_item_id","accessory_id");--> statement-breakpoint
ALTER TABLE "montajes" ADD CONSTRAINT "montajes_stock_zone_id_zones_id_fk" FOREIGN KEY ("stock_zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE no action;