import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }

    // Set session
    await setUserSession(event, user)

    return {
      success: true,
      message: 'Login successful'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    throw error
  }
})
