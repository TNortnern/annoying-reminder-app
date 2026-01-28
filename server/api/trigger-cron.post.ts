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
    const toActivate = await prisma.$queryRaw<Array<{
      id: string
      eventName: string
      eventDateTime: Date
      hoursBeforeStart: number
      emailIntervalHours: number
      status: string
      acknowledgeToken: string
      lastEmailSentAt: Date | null
      acknowledgedAt: Date | null
      createdAt: Date
      updatedAt: Date
      emailRecipients: string[]
    }>>`
      SELECT * FROM reminders
      WHERE status = 'pending'
      AND event_date_time - (hours_before_start * interval '1 hour') <= ${now}
    `

    if (toActivate.length > 0) {
      console.log(`[Manual Cron] Activating ${toActivate.length} reminder(s)`)

      for (const reminder of toActivate) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'active' }
        })
        console.log(`  ✓ Activated: ${reminder.eventName}`)
        results.activated++
      }
    }

    // Step 2: Find active reminders that need emails
    const toEmail = await prisma.$queryRaw<Array<{
      id: string
      eventName: string
      eventDateTime: Date
      hoursBeforeStart: number
      emailIntervalHours: number
      status: string
      acknowledgeToken: string
      lastEmailSentAt: Date | null
      acknowledgedAt: Date | null
      createdAt: Date
      updatedAt: Date
      emailRecipients: string[]
    }>>`
      SELECT * FROM reminders
      WHERE status = 'active'
      AND (
        last_email_sent_at IS NULL
        OR last_email_sent_at + (email_interval_hours * interval '1 hour') <= ${now}
      )
    `

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
