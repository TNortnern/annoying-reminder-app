import { prisma } from '~/server/db/prisma'
import { sendReminderEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const now = new Date()
  const results = {
    activated: 0,
    emailed: 0,
    errors: [] as string[]
  }

  try {
    console.log('[Manual Cron] Starting reminder check...')

    // Step 1: Activate pending reminders whose start time has arrived
    const toActivate = await prisma.reminder.findMany({
      where: {
        status: 'pending',
        AND: [
          {
            eventDateTime: {
              lte: new Date(now.getTime() + 6 * 60 * 60 * 1000) // event_date_time - hours_before_start <= now
            }
          }
        ]
      }
    })

    // Filter manually for hoursBeforeStart logic
    const pendingToActivate = toActivate.filter(r => {
      const activationTime = new Date(r.eventDateTime.getTime() - r.hoursBeforeStart * 60 * 60 * 1000)
      return activationTime <= now
    })

    if (pendingToActivate.length > 0) {
      console.log(`[Manual Cron] Activating ${pendingToActivate.length} reminder(s)`)

      for (const reminder of pendingToActivate) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'active' }
        })
        console.log(`  ✓ Activated: ${reminder.eventName}`)
        results.activated++
      }
    }

    // Step 2: Find active reminders that need emails
    const activeReminders = await prisma.reminder.findMany({
      where: { status: 'active' }
    })

    // Filter those that need emailing based on interval
    const toEmail = activeReminders.filter(r => {
      if (!r.lastEmailSentAt) return true
      const nextEmailTime = new Date(r.lastEmailSentAt.getTime() + r.emailIntervalHours * 60 * 60 * 1000)
      return nextEmailTime <= now
    })

    if (toEmail.length > 0) {
      console.log(`[Manual Cron] Sending ${toEmail.length} reminder email(s)`)

      for (const reminder of toEmail) {
        try {
          await sendReminderEmail(reminder)
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { lastEmailSentAt: now }
          })
          console.log(`  ✓ Sent: ${reminder.eventName}`)
          results.emailed++
        } catch (error: any) {
          console.error(`  ✗ Failed to send: ${reminder.eventName}`, error)
          results.errors.push(`${reminder.eventName}: ${error.message}`)
        }
      }
    }

    console.log('[Manual Cron] Finished reminder check')

    return { 
      success: true, 
      results,
      timestamp: now.toISOString()
    }
  } catch (error: any) {
    console.error('[Manual Cron] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Cron execution failed'
    })
  }
})
