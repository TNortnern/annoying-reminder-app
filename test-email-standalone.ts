// Standalone email test without Nuxt dependencies
import 'dotenv/config'

interface EmailPayload {
  to: Array<{ email: string; name?: string }>
  from?: { email: string; name?: string }
  subject: string
  html: string
}

const testReminder = {
  eventName: 'Test Email from Annoying Reminder App',
  eventDateTime: new Date('2026-01-27T14:00:00Z'),
  emailIntervalHours: 1,
  acknowledgeToken: 'test-token-12345'
}

const acknowledgeUrl = `http://localhost:3000/acknowledge/${testReminder.acknowledgeToken}`

const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder: ${testReminder.eventName}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🔔 Reminder</h1>
    </div>

    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 18px; margin-top: 0;">Hi there!</p>

      <p style="font-size: 16px;">This is your reminder for:</p>

      <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">${testReminder.eventName}</h2>
        <p style="margin: 0; color: #666; font-size: 16px;">
          <strong>Scheduled for:</strong><br>
          ${new Date(testReminder.eventDateTime).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${acknowledgeUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ✓ Acknowledge Reminder
        </a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        You'll continue receiving this email every <strong>${testReminder.emailIntervalHours} hour(s)</strong> until acknowledged.
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
      <p>Annoying Reminder App • Made to keep you on track</p>
    </div>
  </body>
  </html>
`

const payload: EmailPayload = {
  to: [{ email: process.env.EMAIL_TO || 'traynorthern96@gmail.com' }],
  from: { email: 'prob@tnorthern.com', name: 'Prob' },
  subject: `🔔 TEST: ${testReminder.eventName}`,
  html: emailHtml
}

console.log('Testing email sending...')
console.log('To:', payload.to)
console.log('From:', payload.from)
console.log('Subject:', payload.subject)
console.log('API URL:', process.env.EMAIL_GATEWAY_API_URL)

fetch(process.env.EMAIL_GATEWAY_API_URL!, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EMAIL_GATEWAY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
  .then(async (response) => {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }
    return response.json()
  })
  .then((data) => {
    console.log('✓ Email sent successfully!')
    console.log('Response:', data)
    process.exit(0)
  })
  .catch((error) => {
    console.error('✗ Email failed:', error.message)
    process.exit(1)
  })
