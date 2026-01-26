import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const allReminders = await db
    .select()
    .from(reminders)
    .orderBy(desc(reminders.eventDateTime))

  return {
    reminders: allReminders
  }
})
