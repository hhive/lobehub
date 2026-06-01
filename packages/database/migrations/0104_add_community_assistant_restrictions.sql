CREATE TABLE IF NOT EXISTS "community_assistant_restrictions" (
	"identifier" text NOT NULL,
	"source" text DEFAULT 'new' NOT NULL,
	"restricted" boolean DEFAULT true NOT NULL,
	"reason" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_assistant_restrictions_identifier_source_pk" PRIMARY KEY("identifier","source")
);
--> statement-breakpoint
ALTER TABLE "community_assistant_restrictions" DROP CONSTRAINT IF EXISTS "community_assistant_restrictions_updated_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "community_assistant_restrictions" ADD CONSTRAINT "community_assistant_restrictions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_assistant_restrictions_identifier_idx" ON "community_assistant_restrictions" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_assistant_restrictions_source_idx" ON "community_assistant_restrictions" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_assistant_restrictions_restricted_idx" ON "community_assistant_restrictions" USING btree ("restricted");
