import { prisma } from '../db/prisma'
import bcrypt from 'bcrypt'

export default defineNitroPlugin(async () => {
  // Only run seeding in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.RUN_SEED === 'true') {
    try {
      const config = useRuntimeConfig()
      const adminEmail = config.adminEmail
      const adminPassword = config.adminPassword

      // Check if admin user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      })

      if (!existingUser) {
        // Hash password and create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        await prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword
          }
        })

        console.log(`✓ Admin user created: ${adminEmail}`)
      } else {
        console.log(`✓ Admin user already exists: ${adminEmail}`)
      }
    } catch (error) {
      console.error('✗ Failed to seed database:', error)
      // Don't crash the app if seeding fails
    }
  }
})
