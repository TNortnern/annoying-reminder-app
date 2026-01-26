import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export default defineNitroPlugin(async () => {
  // Only run seeding in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.RUN_SEED === 'true') {
    try {
      const config = useRuntimeConfig()
      const adminEmail = config.adminEmail
      const adminPassword = config.adminPassword

      // Check if admin user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1)

      if (!existingUser) {
        // Hash password and create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        await db.insert(users).values({
          email: adminEmail,
          password: hashedPassword
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
