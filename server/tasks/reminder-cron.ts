import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq, and, or, isNull, lte, sql } from 'drizzle-orm'

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
      const toActivate = await db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.status, 'pending'),
            lte(
              sql`${reminders.eventDateTime} - (${reminders.hoursBeforeStart} * interval '1 hour')`,
              now
            )
          )
        )

      if (toActivate.length > 0) {
        console.log(`[Cron] Activating ${toActivate.length} reminder(s)`)

        for (const reminder of toActivate) {
          await db
            .update(reminders)
            .set({ status: 'active' })
            .where(eq(reminders.id, reminder.id))

          console.log(`  ✓ Activated: ${reminder.eventName}`)
        }
      }

      // Step 2: Find active reminders that need emails
      const toEmail = await db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.status, 'active'),
            or(
              isNull(reminders.lastEmailSentAt),
              lte(
                sql`${reminders.lastEmailSentAt} + (${reminders.emailIntervalHours} * interval '1 hour')`,
                now
              )
            )
          )
        )

      if (toEmail.length > 0) {
        console.log(`[Cron] Sending ${toEmail.length} reminder email(s)`)

        for (const reminder of toEmail) {
          try {
            await sendReminderEmail(reminder)

            await db
              .update(reminders)
              .set({ lastEmailSentAt: now })
              .where(eq(reminders.id, reminder.id))

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
