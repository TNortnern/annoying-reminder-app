import { prisma } from '~/server/db/prisma'
import { Prisma } from '@prisma/client'

export default defineTask({
  meta: {
    name: 'reminder-cron',
    description: 'Send reminder emails and activate pending reminders'
  },
  run: async () => {
    console.log('[Cron] Starting reminder check...')
    const now = new Date()

    try {
      // Step 1: Activate pending reminders whose start time has arrived
      // Find reminders where: eventDateTime - (hoursBeforeStart * 1 hour) <= now
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
      }>>`
        SELECT * FROM reminders
        WHERE status = 'pending'
        AND event_date_time - (hours_before_start * interval '1 hour') <= ${now}
      `

      if (toActivate.length > 0) {
        console.log(`[Cron] Activating ${toActivate.length} reminder(s)`)

        for (const reminder of toActivate) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: 'active' }
          })

          console.log(`  ✓ Activated: ${reminder.eventName}`)
        }
      }

      // Step 2: Find active reminders that need emails
      // Find reminders where: status = 'active' AND (lastEmailSentAt IS NULL OR lastEmailSentAt + emailIntervalHours <= now)
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
      }>>`
        SELECT * FROM reminders
        WHERE status = 'active'
        AND (
          last_email_sent_at IS NULL
          OR last_email_sent_at + (email_interval_hours * interval '1 hour') <= ${now}
        )
      `

      if (toEmail.length > 0) {
        console.log(`[Cron] Sending ${toEmail.length} reminder email(s)`)

        for (const reminder of toEmail) {
          try {
            await sendReminderEmail(reminder)

            await prisma.reminder.update({
              where: { id: reminder.id },
              data: { lastEmailSentAt: now }
            })

            console.log(`  ✓ Sent: ${reminder.eventName}`)
          } catch (error) {
            console.error(`  ✗ Failed to send: ${reminder.eventName}`, error)
            // Continue with other reminders even if one fails
          }
        }
      }

      if (toActivate.length === 0 && toEmail.length === 0) {
        console.log('[Cron] No reminders to process')
      }

      console.log('[Cron] Finished reminder check')

      return {
        result: {
          activated: toActivate.length,
          emailed: toEmail.length,
          timestamp: now.toISOString()
        }
      }
    } catch (error) {
      console.error('[Cron] Error in reminder check:', error)
      throw error
    }
  }
})
