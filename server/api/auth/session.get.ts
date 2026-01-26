export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return {
    authenticated: !!session?.userId,
    user: session ? { id: session.userId, email: session.email } : null
  }
})
