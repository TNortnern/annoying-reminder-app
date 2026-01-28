interface EmailPayload {
  to: Array<{ email: string; name?: string }>
  from?: { email: string; name?: string }
  subject: string
  html: string
}

interface Reminder {
  id: string
  eventName: string
  eventDateTime: Date
  emailRecipients: string[]
  hoursBeforeStart: number
  emailIntervalHours: number
  status: string
  acknowledgeToken: string
  lastEmailSentAt: Date | null
  acknowledgedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function sendReminderEmail(reminder: Reminder) {
  const config = useRuntimeConfig()

  const acknowledgeUrl = `${config.public.appUrl}/acknowledge/${reminder.acknowledgeToken}`

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: ${reminder.eventName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🔔 Reminder</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi there!</p>

        <p style="font-size: 16px;">This is your reminder for:</p>

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">${reminder.eventName}</h2>
          <p style="margin: 0; color: #666; font-size: 16px;">
            <strong>Scheduled for:</strong><br>
            ${new Date(reminder.eventDateTime).toLocaleString('en-US', {
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
          You'll continue receiving this email every <strong>${reminder.emailIntervalHours} hour(s)</strong> until acknowledged.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>Annoying Reminder App • Made to keep you on track</p>
      </div>
    </body>
    </html>
  `

  const payload: EmailPayload = {
    to: reminder.emailRecipients.map(email => ({ email })),
    from: { email: 'prob@tnorthern.com', name: 'Prob' },
    subject: `🔔 Reminder: ${reminder.eventName}`,
    html: emailHtml
  }

  try {
    const response = await $fetch(config.emailGatewayApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.emailGatewayApiKey}`,
        'Content-Type': 'application/json'
      },
      body: payload
    })

    console.log(`✓ Email sent for reminder: ${reminder.eventName}`)
    return { success: true, response }
  } catch (error) {
    console.error(`✗ Failed to send email for reminder: ${reminder.eventName}`, error)
    throw error
  }
}

export async function sendTestEmail(emailTo: string) {
  const config = useRuntimeConfig()
  
  // Debug logging
  console.log('sendTestEmail - Runtime config:', {
    apiUrl: config.emailGatewayApiUrl,
    apiKeyExists: !!config.emailGatewayApiKey,
    apiKeyLength: config.emailGatewayApiKey?.length || 0
  })

  const testToken = `test-${Date.now()}`
  const acknowledgeUrl = `${config.public.appUrl}/acknowledge/${testToken}`

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email from Annoying Reminder App</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">📧 Test Email</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi there!</p>

        <p style="font-size: 16px;">This is a test email from your <strong>Annoying Reminder App</strong> deployed on Railway.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">✅ Email Configuration Working!</h2>
          <p style="margin: 0; color: #666; font-size: 16px;">
            <strong>Sent at:</strong><br>
            ${new Date().toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZoneName: 'short'
            })}
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            <strong>Environment:</strong> Production (Railway)
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${acknowledgeUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Test Acknowledge Link
          </a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          If you're receiving this, your email gateway is configured correctly! 🎉
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>Annoying Reminder App • Railway Deployment Test</p>
      </div>
    </body>
    </html>
  `

  const payload: EmailPayload = {
    to: [{ email: emailTo }],
    from: { email: 'prob@tnorthern.com', name: 'Prob' },
    subject: `📧 Test: Annoying Reminder App Email Configuration`,
    html: emailHtml
  }

  try {
    const response = await $fetch(config.emailGatewayApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.emailGatewayApiKey}`,
        'Content-Type': 'application/json'
      },
      body: payload
    })

    console.log(`✓ Test email sent to: ${emailTo}`)
    return { success: true, response }
  } catch (error) {
    console.error(`✗ Failed to send test email to: ${emailTo}`, error)
    throw error
  }
}
