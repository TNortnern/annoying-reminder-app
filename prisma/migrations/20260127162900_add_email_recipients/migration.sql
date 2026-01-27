-- AlterTable
ALTER TABLE "reminders" ADD COLUMN "email_recipients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
