import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Reminder ID required'
    })
  }

  const [reminder] = await db
    .delete(reminders)
    .where(eq(reminders.id, id))
    .returning()

  if (!reminder) {
    throw createError({
      statusCode: 404,
      message: 'Reminder not found'
    })
  }

  return {
    success: true,
    message: 'Reminder deleted'
  }
})
