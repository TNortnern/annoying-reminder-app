import { z } from 'zod'
import { prisma } from '~/server/db/prisma'

const createReminderSchema = z.object({
  eventName: z.string().min(1).max(255),
  eventDateTime: z.string().datetime(),
  emailRecipients: z.array(z.string().email()).min(1, 'At least one email recipient is required'),
  hoursBeforeStart: z.number().int().min(0).default(6),
  emailIntervalMinutes: z.number().int().min(1).default(10)
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const body = await readBody(event)
    const data = createReminderSchema.parse(body)

    const reminder = await prisma.reminder.create({
      data: {
        eventName: data.eventName,
        eventDateTime: new Date(data.eventDateTime),
        emailRecipients: data.emailRecipients,
        hoursBeforeStart: data.hoursBeforeStart,
        emailIntervalMinutes: data.emailIntervalMinutes,
        acknowledgeToken: generateAcknowledgeToken(),
        status: 'pending'
      }
    })

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
