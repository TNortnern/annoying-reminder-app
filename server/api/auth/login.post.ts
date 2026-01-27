import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '~/server/db/prisma'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

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

    // Set session using nuxt-auth-utils
    await setUserSession(event, {
      user: {
        userId: user.id,
        email: user.email
      },
      loggedInAt: Date.now()
    })

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
