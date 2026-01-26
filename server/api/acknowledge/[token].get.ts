import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Token required'
    })
  }

  const [reminder] = await db
    .select()
    .from(reminders)
    .where(eq(reminders.acknowledgeToken, token))
    .limit(1)

  if (!reminder) {
    throw createError({
      statusCode: 404,
      message: 'Reminder not found'
    })
  }

  // Already acknowledged
  if (reminder.status === 'acknowledged') {
    return {
      success: true,
      message: 'Reminder already acknowledged',
      reminder
    }
  }

  // Acknowledge the reminder
  const [updated] = await db
    .update(reminders)
    .set({
      status: 'acknowledged',
      acknowledgedAt: new Date()
    })
    .where(eq(reminders.acknowledgeToken, token))
    .returning()

  return {
    success: true,
    message: 'Reminder acknowledged',
    reminder: updated
  }
})
