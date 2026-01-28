-- Rename email_interval_hours to email_interval_minutes and change default
ALTER TABLE reminders RENAME COLUMN email_interval_hours TO email_interval_minutes;
ALTER TABLE reminders ALTER COLUMN email_interval_minutes SET DEFAULT 10;

-- Update existing reminders to use minutes (convert hours to minutes)
UPDATE reminders SET email_interval_minutes = email_interval_minutes * 60 WHERE email_interval_minutes > 0;
