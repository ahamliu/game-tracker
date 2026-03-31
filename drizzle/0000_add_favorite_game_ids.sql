CREATE TYPE "public"."activity_type" AS ENUM('completed', 'started', 'rated', 'dropped', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('planning', 'playing', 'completed', 'on_hold', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."game_source" AS ENUM('igdb', 'user');--> statement-breakpoint
CREATE TYPE "public"."list_visibility" AS ENUM('public', 'unlisted', 'private');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"library_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"library_entry_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"status" "entry_status" DEFAULT 'planning' NOT NULL,
	"rating" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "game_source" NOT NULL,
	"igdb_id" integer,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"summary" text,
	"release_date" timestamp with time zone,
	"cover_url" text,
	"platforms" jsonb,
	"genres" jsonb,
	"developer_name" varchar(300),
	"aggregated_rating" integer,
	"aggregated_rating_count" integer,
	"total_rating" integer,
	"total_rating_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_by" uuid,
	"report_count" integer DEFAULT 0 NOT NULL,
	"moderation_status" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "library_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"status" "entry_status" DEFAULT 'planning' NOT NULL,
	"rating" integer,
	"notes" text,
	"progress_percent" integer,
	"progress_note" varchar(500),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"library_entry_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"visibility" "list_visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone,
	"password_hash" varchar(255) NOT NULL,
	"handle" varchar(32) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"bio" text,
	"favorite_game_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_library_entry_id_library_entries_id_fk" FOREIGN KEY ("library_entry_id") REFERENCES "public"."library_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_routes" ADD CONSTRAINT "character_routes_library_entry_id_library_entries_id_fk" FOREIGN KEY ("library_entry_id") REFERENCES "public"."library_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_memberships" ADD CONSTRAINT "list_memberships_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_memberships" ADD CONSTRAINT "list_memberships_library_entry_id_library_entries_id_fk" FOREIGN KEY ("library_entry_id") REFERENCES "public"."library_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_user_created_idx" ON "activities" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "routes_entry_idx" ON "character_routes" USING btree ("library_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_unique" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "games_igdb_id_unique" ON "games" USING btree ("igdb_id");--> statement-breakpoint
CREATE INDEX "games_title_idx" ON "games" USING btree ("title");--> statement-breakpoint
CREATE INDEX "games_slug_idx" ON "games" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "library_user_game_unique" ON "library_entries" USING btree ("user_id","game_id");--> statement-breakpoint
CREATE INDEX "library_user_idx" ON "library_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "library_game_idx" ON "library_entries" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "list_entry_unique" ON "list_memberships" USING btree ("list_id","library_entry_id");--> statement-breakpoint
CREATE INDEX "list_memberships_list_idx" ON "list_memberships" USING btree ("list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lists_user_slug_unique" ON "lists" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "users_handle_idx" ON "users" USING btree ("handle");