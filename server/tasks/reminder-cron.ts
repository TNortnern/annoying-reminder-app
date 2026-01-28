import { prisma } from '~/server/db/prisma'
import { sendReminderEmail } from '~/server/utils/email'

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
      const toActivate = await prisma.reminder.findMany({
        where: {
          status: 'pending'
        }
      })

      // Filter manually for hoursBeforeStart logic
      const pendingToActivate = toActivate.filter(r => {
        const activationTime = new Date(r.eventDateTime.getTime() - r.hoursBeforeStart * 60 * 60 * 1000)
        return activationTime <= now
      })

      if (pendingToActivate.length > 0) {
        console.log(`[Cron] Activating ${pendingToActivate.length} reminder(s)`)

        for (const reminder of pendingToActivate) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: 'active' }
          })
          console.log(`  ✓ Activated: ${reminder.eventName}`)
        }
      }

      // Step 2: Find active reminders that need emails
      // Only get reminders that are active AND not acknowledged
      const activeReminders = await prisma.reminder.findMany({
        where: { 
          status: 'active',
          acknowledgedAt: null  // Don't email acknowledged reminders
        }
      })

      // Filter those that need emailing based on interval
      const toEmail = activeReminders.filter(r => {
        if (!r.lastEmailSentAt) {
          console.log(`  → ${r.eventName}: never emailed, will send now`)
          return true
        }
        const nextEmailTime = new Date(r.lastEmailSentAt.getTime() + r.emailIntervalMinutes * 60 * 1000)
        const shouldEmail = nextEmailTime <= now
        const minutesUntilNext = Math.round((nextEmailTime.getTime() - now.getTime()) / 60000)
        console.log(`  → ${r.eventName}: last emailed ${Math.round((now.getTime() - r.lastEmailSentAt.getTime())/60000)}min ago, next due in ${minutesUntilNext}min, interval=${r.emailIntervalMinutes}min, willSend=${shouldEmail}`)
        return shouldEmail
      })

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
