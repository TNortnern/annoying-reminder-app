CREATE TYPE "public"."status" AS ENUM('pending', 'active', 'acknowledged');--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_date_time" timestamp with time zone NOT NULL,
	"hours_before_start" integer DEFAULT 6 NOT NULL,
	"email_interval_hours" integer DEFAULT 1 NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"acknowledge_token" varchar(64) NOT NULL,
	"last_email_sent_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_acknowledge_token_unique" UNIQUE("acknowledge_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
