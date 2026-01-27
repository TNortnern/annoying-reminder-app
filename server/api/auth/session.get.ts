export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return {
    authenticated: !!session?.user?.userId,
    user: session?.user ? { id: session.user.userId, email: session.user.email } : null
  }
})
