ALTER TABLE "montajes" ADD COLUMN "install_token" varchar(64);--> statement-breakpoint
ALTER TABLE "montajes" ADD CONSTRAINT "montajes_install_token_unique" UNIQUE("install_token");