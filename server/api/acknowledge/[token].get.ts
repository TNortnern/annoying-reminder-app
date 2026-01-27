import { prisma } from '~/server/db/prisma'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Token required'
    })
  }

  const reminder = await prisma.reminder.findUnique({
    where: { acknowledgeToken: token }
  })

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
  const updated = await prisma.reminder.update({
    where: { acknowledgeToken: token },
    data: {
      status: 'acknowledged',
      acknowledgedAt: new Date()
    }
  })

  return {
    success: true,
    message: 'Reminder acknowledged',
    reminder: updated
  }
})
