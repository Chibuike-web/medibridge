ALTER TABLE "member" ADD COLUMN "staff_type" text;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "departments" text[];
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "permissions" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "mcp_scopes" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "staff_type" text;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "departments" text[];
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "permissions" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "mcp_scopes" text[] DEFAULT '{}' NOT NULL;
