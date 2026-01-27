-- CreateEnum
CREATE TYPE "status" AS ENUM ('pending', 'active', 'acknowledged');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_name" VARCHAR(255) NOT NULL,
    "event_date_time" TIMESTAMPTZ NOT NULL,
    "hours_before_start" INTEGER NOT NULL DEFAULT 6,
    "email_interval_hours" INTEGER NOT NULL DEFAULT 1,
    "status" "status" NOT NULL DEFAULT 'pending',
    "acknowledge_token" VARCHAR(64) NOT NULL,
    "last_email_sent_at" TIMESTAMPTZ,
    "acknowledged_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_acknowledge_token_key" ON "reminders"("acknowledge_token");
