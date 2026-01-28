import { sendTestEmail } from '../utils/email'

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const emailTo = body.emailTo || 'traynorthern96@gmail.com'

  // Debug: Log runtime config (mask sensitive values)
  const config = useRuntimeConfig()
  console.log('Debug - Email Config:', {
    apiUrl: config.emailGatewayApiUrl,
    apiKeyExists: !!config.emailGatewayApiKey,
    apiKeyPrefix: config.emailGatewayApiKey ? config.emailGatewayApiKey.substring(0, 10) + '...' : 'undefined',
    from: config.emailFrom
  })

  try {
    const result = await sendTestEmail(emailTo)
    return { success: true, result }
  } catch (error: any) {
    console.error('Test email failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to send test email'
    })
  }
})
