CREATE TABLE "montaje_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"montaje_id" uuid NOT NULL,
	"sensor_id" uuid NOT NULL,
	"location" varchar(200) NOT NULL,
	"photo_path" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "montajes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" varchar(200) NOT NULL,
	"address" varchar(500) NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "montaje_items" ADD CONSTRAINT "montaje_items_montaje_id_montajes_id_fk" FOREIGN KEY ("montaje_id") REFERENCES "public"."montajes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montaje_items" ADD CONSTRAINT "montaje_items_sensor_id_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("id") ON DELETE restrict ON UPDATE no action;