import { pgTable, uuid, varchar, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'

export const statusEnum = pgEnum('status', ['pending', 'active', 'acknowledged'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventDateTime: timestamp('event_date_time', { withTimezone: true }).notNull(),
  hoursBeforeStart: integer('hours_before_start').notNull().default(6),
  emailIntervalHours: integer('email_interval_hours').notNull().default(1),
  status: statusEnum('status').notNull().default('pending'),
  acknowledgeToken: varchar('acknowledge_token', { length: 64 }).notNull().unique(),
  lastEmailSentAt: timestamp('last_email_sent_at', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
