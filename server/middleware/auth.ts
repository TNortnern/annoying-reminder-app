export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Protected API routes
  const protectedPaths = ['/api/reminders']

  // Check if path is protected
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected) {
    await requireAuth(event)
  }
})
