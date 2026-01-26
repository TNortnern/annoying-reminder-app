// Quick test script to verify email sending works
import { sendReminderEmail } from './server/utils/email'

const testReminder = {
  id: 'test-id',
  eventName: 'Test Email from Annoying Reminder App',
  eventDateTime: new Date('2026-01-27T14:00:00Z'),
  hoursBeforeStart: 6,
  emailIntervalHours: 1,
  status: 'active' as const,
  acknowledgeToken: 'test-token-12345',
  lastEmailSentAt: null,
  acknowledgedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

console.log('Testing email sending...')
console.log('To: traynorthern96@gmail.com')
console.log('Event:', testReminder.eventName)

sendReminderEmail(testReminder)
  .then(() => {
    console.log('✓ Email sent successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('✗ Email failed:', error)
    process.exit(1)
  })
