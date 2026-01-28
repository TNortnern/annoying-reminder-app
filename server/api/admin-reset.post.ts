import bcrypt from 'bcrypt'
import { prisma } from '~/server/db/prisma'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    // Get current admin config
    const adminEmail = config.adminEmail
    const adminPassword = config.adminPassword
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    // Update or create admin user
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password: hashedPassword },
      create: {
        email: adminEmail,
        password: hashedPassword
      }
    })
    
    return { success: true, message: 'Admin password updated' }
  } catch (error: any) {
    console.error('Failed to reset admin:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to reset admin'
    })
  }
})
