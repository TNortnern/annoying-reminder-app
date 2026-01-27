import { prisma } from '~/server/db/prisma'

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
    await prisma.reminder.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Reminder deleted'
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: 'Reminder not found'
    })
  }
})
