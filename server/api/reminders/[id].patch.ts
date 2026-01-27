import { z } from 'zod'
import { prisma } from '~/server/db/prisma'

const updateReminderSchema = z.object({
  eventName: z.string().min(1).max(255).optional(),
  eventDateTime: z.string().datetime().optional(),
  emailRecipients: z.array(z.string().email()).min(1).optional(),
  hoursBeforeStart: z.number().int().min(0).optional(),
  emailIntervalHours: z.number().int().min(1).optional(),
  status: z.enum(['pending', 'active', 'acknowledged']).optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Reminder ID required'
    })
  }

  try {
    const body = await readBody(event)
    const data = updateReminderSchema.parse(body)

    const updateData: any = {}

    if (data.eventName) updateData.eventName = data.eventName
    if (data.eventDateTime) updateData.eventDateTime = new Date(data.eventDateTime)
    if (data.emailRecipients) updateData.emailRecipients = data.emailRecipients
    if (data.hoursBeforeStart !== undefined) updateData.hoursBeforeStart = data.hoursBeforeStart
    if (data.emailIntervalHours !== undefined) updateData.emailIntervalHours = data.emailIntervalHours
    if (data.status) updateData.status = data.status

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData
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
