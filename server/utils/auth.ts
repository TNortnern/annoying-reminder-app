import { H3Event } from 'h3'
import type { User } from '~/server/db/schema'

const SESSION_NAME = 'reminder_session'

export async function setUserSession(event: H3Event, user: User) {
  await setSession(event, SESSION_NAME, {
    userId: user.id,
    email: user.email,
    timestamp: Date.now()
  })
}

export async function getUserSession(event: H3Event) {
  return await getSession(event, SESSION_NAME)
}

export async function clearUserSession(event: H3Event) {
  await clearSession(event, SESSION_NAME)
}

export async function requireAuth(event: H3Event) {
  const session = await getUserSession(event)

  if (!session?.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  return session
}
