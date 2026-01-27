import { H3Event } from 'h3'

interface User {
  id: string
  email: string
}

// nuxt-auth-utils automatically provides getUserSession and setUserSession
// We just need to extend them with our custom session data

export async function requireAuth(event: H3Event) {
  const session = await getUserSession(event)

  if (!session?.user?.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  return session.user
}
