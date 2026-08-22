ALTER TABLE "sensors" ALTER COLUMN "type" SET DATA TYPE varchar(60);--> statement-breakpoint
ALTER TABLE "sensors" ALTER COLUMN "type" SET DEFAULT 'otro';--> statement-breakpoint
DROP TYPE "public"."sensor_type";