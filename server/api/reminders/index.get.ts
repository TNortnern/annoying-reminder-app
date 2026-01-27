import { prisma } from '~/server/db/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const allReminders = await prisma.reminder.findMany({
    orderBy: { eventDateTime: 'desc' }
  })

  return {
    reminders: allReminders
  }
})
