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
