import { z } from 'zod'
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'

const createReminderSchema = z.object({
  eventName: z.string().min(1).max(255),
  eventDateTime: z.string().datetime(),
  hoursBeforeStart: z.number().int().min(0).default(6),
  emailIntervalHours: z.number().int().min(1).default(1)
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const body = await readBody(event)
    const data = createReminderSchema.parse(body)

    const [reminder] = await db
      .insert(reminders)
      .values({
        eventName: data.eventName,
        eventDateTime: new Date(data.eventDateTime),
        hoursBeforeStart: data.hoursBeforeStart,
        emailIntervalHours: data.emailIntervalHours,
        acknowledgeToken: generateAcknowledgeToken(),
        status: 'pending'
      })
      .returning()

    return {
      reminder
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    throw error
  }
})
